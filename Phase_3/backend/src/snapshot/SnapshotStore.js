/**
 * SnapshotStore
 * Creates and loads point-in-time binary/JSON snapshots with CRC32 integrity checks.
 * Uses atomic temporary file write and rename to prevent corrupted writes.
 */
import fs from 'fs';
import path from 'path';
import { computeCRC32Hex } from '../utils/crc32.js';

export class SnapshotStore {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Saves cache state atomically.
   */
  saveSnapshot(entriesMap, checkpointLsn) {
    const entries = [];
    const now = Date.now();

    for (const [key, node] of entriesMap.entries()) {
      if (!node.isExpired(now)) {
        entries.push({
          key: node.key,
          value: node.value,
          createdAt: node.createdAt,
          expiresAt: node.expiresAt,
          accessCount: node.accessCount
        });
      }
    }

    const payload = {
      magic: 'SPIT_SNAPSHOT_V1',
      checkpointLsn,
      timestamp: now,
      entryCount: entries.length,
      entries
    };

    const serializedPayload = JSON.stringify(payload);
    const checksum = computeCRC32Hex(serializedPayload);

    const snapshotData = JSON.stringify({
      header: {
        magic: payload.magic,
        checkpointLsn,
        timestamp: payload.timestamp,
        entryCount: payload.entryCount,
        checksum
      },
      data: payload
    }, null, 2);

    // Write to atomic temp file first with strict 0o600 permissions
    const tempFile = `${this.filePath}.tmp`;
    fs.writeFileSync(tempFile, snapshotData, { encoding: 'utf-8', mode: 0o600 });
    fs.renameSync(tempFile, this.filePath);

    return {
      checkpointLsn,
      entryCount: entries.length,
      timestamp: now,
      checksum,
      fileSizeBytes: fs.statSync(this.filePath).size
    };
  }

  /**
   * Loads and validates the snapshot file.
   */
  loadSnapshot() {
    if (!fs.existsSync(this.filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(content);
      
      const expectedChecksum = parsed.header.checksum;
      const actualChecksum = computeCRC32Hex(JSON.stringify(parsed.data));

      if (expectedChecksum.toUpperCase() !== actualChecksum.toUpperCase()) {
        console.error('Snapshot checksum validation failed! Corrupted snapshot detected.');
        return null;
      }

      return parsed.data;
    } catch (e) {
      console.error('Failed to load snapshot:', e.message);
      return null;
    }
  }

  exists() {
    return fs.existsSync(this.filePath);
  }

  getFileSize() {
    try {
      return fs.statSync(this.filePath).size;
    } catch (e) {
      return 0;
    }
  }
}
