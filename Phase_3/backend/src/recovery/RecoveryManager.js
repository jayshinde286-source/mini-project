/**
 * RecoveryManager
 * Coordinates two-phase cold-boot crash recovery:
 * Phase 1: Reconstitute state from snapshot checkpoint.
 * Phase 2: Replay remaining WAL log records with CRC32 verification.
 */
import { OpCode } from '../wal/WalRecord.js';
import { EventType } from '../events/EventBus.js';

export class RecoveryManager {
  constructor(engine, walManager, snapshotStore, eventBus) {
    this.engine = engine;
    this.walManager = walManager;
    this.snapshotStore = snapshotStore;
    this.eventBus = eventBus;
  }

  performRecovery() {
    const startTime = Date.now();
    const summary = {
      snapshotFound: false,
      snapshotLsn: 0,
      restoredFromSnapshotCount: 0,
      replayedFromWalCount: 0,
      corruptedRecordsIsolated: 0,
      lastRecoveredLsn: 0,
      elapsedMs: 0
    };

    // Phase 1: Restore Snapshot
    if (this.snapshotStore.exists()) {
      const snapshot = this.snapshotStore.loadSnapshot();
      if (snapshot && snapshot.entries) {
        summary.snapshotFound = true;
        summary.snapshotLsn = snapshot.checkpointLsn;
        const now = Date.now();

        for (const item of snapshot.entries) {
          if (item.expiresAt === 0 || item.expiresAt > now) {
            this.engine.restoreNodeDirectly(item.key, item.value, item.createdAt, item.expiresAt, item.accessCount);
            summary.restoredFromSnapshotCount++;
          }
        }
        summary.lastRecoveredLsn = snapshot.checkpointLsn;
      }
    }

    // Phase 2: Replay WAL from snapshotLsn forward
    const walRecords = this.walManager.readAllRecords();
    const now = Date.now();

    for (const record of walRecords) {
      // Skip records already included in snapshot
      if (record.lsn <= summary.snapshotLsn) {
        continue;
      }

      // Check CRC32 integrity
      if (!record.verifyChecksum()) {
        console.warn(`[RECOVERY] Checksum mismatch at LSN ${record.lsn}. Isolating bad record.`);
        summary.corruptedRecordsIsolated++;
        break; // Stop replay at first corrupted boundary
      }

      // Apply state mutation
      switch (record.opcode) {
        case OpCode.SET:
        case OpCode.UPDATE: {
          const ttlRemainingSec = record.ttlSeconds > 0 
            ? Math.max(0, Math.round((record.timestamp + (record.ttlSeconds * 1000) - now) / 1000))
            : 0;

          if (record.ttlSeconds === 0 || (record.timestamp + (record.ttlSeconds * 1000) > now)) {
            this.engine.restoreNodeDirectly(
              record.key,
              record.value,
              record.timestamp,
              record.ttlSeconds > 0 ? record.timestamp + (record.ttlSeconds * 1000) : 0,
              1
            );
            summary.replayedFromWalCount++;
          }
          break;
        }

        case OpCode.DEL:
        case OpCode.EVICT:
        case OpCode.EXPIRE: {
          this.engine.removeNodeDirectly(record.key);
          summary.replayedFromWalCount++;
          break;
        }

        case OpCode.CLEAR: {
          this.engine.clearDirectly();
          summary.replayedFromWalCount++;
          break;
        }
      }

      summary.lastRecoveredLsn = record.lsn;
    }

    summary.elapsedMs = Date.now() - startTime;
    this.eventBus.publish(EventType.RECOVERY_COMPLETED, summary);
    return summary;
  }
}
