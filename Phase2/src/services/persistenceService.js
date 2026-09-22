/**
 * Persistence Service Layer
 * Interfaces with WriteAheadLog, SnapshotManager, and ChecksumUtil
 */

import { apiRequest, API_CONFIG } from './apiService.js';
import { crc32Hex } from '../utils/checksum.js';

export const persistenceService = {
  async getWALStatus() {
    if (!API_CONFIG.IS_MOCK_MODE) {
      return await apiRequest('/persistence/wal/status');
    }
    return null;
  },

  async getWALRecords() {
    if (!API_CONFIG.IS_MOCK_MODE) {
      return await apiRequest('/persistence/wal/records');
    }
    return null;
  },

  async getSnapshotStatus() {
    if (!API_CONFIG.IS_MOCK_MODE) {
      return await apiRequest('/persistence/snapshot');
    }
    return null;
  },

  async createSnapshot() {
    if (!API_CONFIG.IS_MOCK_MODE) {
      return await apiRequest('/persistence/snapshot', { method: 'POST' });
    }
    return null;
  },

  createWalRecord(sequence, op, key, value = '', expiresAt = 0, txnId = `TXN-${String(sequence).padStart(6, '0')}`) {
    const timestamp = Date.now();
    const payload = `V2\t${sequence}\t${timestamp}\t${txnId}\t${op}\t${expiresAt}\t${btoa(key)}\t${btoa(value)}`;
    return {
      sequence,
      timestamp,
      transactionId: txnId,
      operation: op,
      key,
      value,
      expiresAt,
      checksum: '0x' + crc32Hex(payload),
      status: 'VALID'
    };
  }
};
