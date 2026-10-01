/**
 * Persistence real telemetry state matching edu.spit.cache.persistence package
 * Supports V2 WAL format with IEEE 802.3 CRC32 hex checksums.
 * Clean 0 baseline with no fabricated mock counts.
 */
import { crc32Hex } from '../utils/checksum';

const now = Date.now();

export const initialPersistenceOverview = {
  persistenceStatus: 'Active',
  walStatus: 'Healthy',
  snapshotStatus: 'Standby',
  lastSnapshotTime: 0,
  walRecordsCount: 0,
  pendingWrites: 0
};

export const createRealWalRecord = (sequence, txnId, op, key, val, expiresAt = 0) => {
  const ts = Date.now();
  const payload = `V2\t${sequence}\t${ts}\t${txnId}\t${op}\t${expiresAt}\t${btoa(key)}\t${btoa(typeof val === 'string' ? val : JSON.stringify(val))}`;
  return {
    sequence,
    timestamp: ts,
    transactionId: txnId,
    operation: op,
    key,
    value: val,
    expiresAt,
    checksum: '0x' + crc32Hex(payload),
    status: 'VALID'
  };
};

export const initialWalRecords = [];

export const initialSnapshot = {
  id: 'none',
  version: 0,
  entriesCount: 0,
  createdAt: 0,
  checksum: '0x00000000',
  status: 'NO_SNAPSHOT',
  sizeBytes: '0 B'
};

export const initialRecoveryStatus = {
  status: 'READY',
  lastRecoveryTimestamp: 0,
  latestSnapshotStatus: 'NONE',
  walIntegrityStatus: 'CLEAN',
  recoverableEntries: 0,
  report: {
    snapshotEntriesRestored: 0,
    walOperationsApplied: 0,
    incompleteTransactionOperationsSkipped: 0,
    rejectedTransactionBatches: 0,
    legacyTransactionBatchesAccepted: 0,
    expiredEntriesSkipped: 0,
    malformedWalRecords: 0,
    checksumFailures: 0,
    snapshotSequence: 0,
    finalWalSequence: 0,
    totalEntriesMaterialized: 0
  }
};
