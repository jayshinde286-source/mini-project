/**
 * Persistence mock data matching edu.spit.cache.persistence package
 * Supports V2 WAL format with CRC32 hex checksums
 */

import { crc32Hex } from '../utils/checksum';

const now = Date.now();

export const initialPersistenceOverview = {
  persistenceStatus: 'Active',
  walStatus: 'Healthy',
  snapshotStatus: 'Available',
  lastSnapshotTime: now - 180000,
  walRecordsCount: 2431,
  pendingWrites: 3
};

const createMockWalRecord = (sequence, deltaSeconds, txnId, op, key, val, expiresAt = 0) => {
  const ts = now - deltaSeconds * 1000;
  const payload = `V2\t${sequence}\t${ts}\t${txnId}\t${op}\t${expiresAt}\t${btoa(key)}\t${btoa(val)}`;
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

export const initialWalRecords = [
  createMockWalRecord(2431, 2, 'TXN-001024', 'SET', 'user:1024', 'John Doe Active', now + 60000),
  createMockWalRecord(2430, 8, 'TXN-001023', 'SET', 'session:8842', 'user_state_student_active_session_8842', now + 180000),
  createMockWalRecord(2429, 35, 'TXN-001022', 'DELETE', 'temp:token:old', ''),
  createMockWalRecord(2428, 62, 'TXN-001021', 'SET', 'product:889', 'MacBook Pro M3 Max 36GB Unified Memory', now - 10000),
  createMockWalRecord(2427, 95, 'TXN-001020', 'SET', 'user:1001', 'Jay Shinde (UID 2024800115)', now + 58000),
  createMockWalRecord(2426, 120, 'TXN-001019', 'DELETE', 'temp:session:102', ''),
  createMockWalRecord(2425, 145, 'TXN-001018', 'SET', 'session:4421', 'auth_jwt_token_b3_cse_spit_valid', now + 720000),
  createMockWalRecord(2424, 180, 'TXN-001017', 'SET', 'config:database', 'jdbc:postgresql://localhost:5432/spit_cache_pool?max=30', 0)
];

export const initialSnapshot = {
  id: 'snapshot_2026_09_23_1041',
  version: 42,
  entriesCount: 128,
  createdAt: now - 180000,
  checksum: '0x9E4A10B3',
  status: 'VALID',
  sizeBytes: '24.8 KB'
};

export const initialRecoveryStatus = {
  status: 'READY',
  lastRecoveryTimestamp: now - 86400000, // 24h ago
  latestSnapshotStatus: 'VALID',
  walIntegrityStatus: 'VALID',
  recoverableEntries: 128,
  report: {
    snapshotEntriesRestored: 124,
    walOperationsApplied: 4,
    incompleteTransactionOperationsSkipped: 0,
    rejectedTransactionBatches: 0,
    legacyTransactionBatchesAccepted: 0,
    expiredEntriesSkipped: 2,
    malformedWalRecords: 0,
    checksumFailures: 0,
    snapshotSequence: 2420,
    finalWalSequence: 2431,
    totalEntriesMaterialized: 128
  }
};
