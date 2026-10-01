/**
 * WalRecord
 * Implements structured Write-Ahead Log record formatting with 32-bit CRC.
 */
import { computeCRC32, computeCRC32Hex } from '../utils/crc32.js';

export const OpCode = {
  SET: 'SET',
  UPDATE: 'UPDATE',
  DEL: 'DEL',
  EVICT: 'EVICT',
  EXPIRE: 'EXPIRE',
  CLEAR: 'CLEAR',
  SNAPSHOT_CHECKPOINT: 'SNAPSHOT_CHECKPOINT'
};

export class WalRecord {
  constructor({ lsn, timestamp, opcode, key, value = null, ttlSeconds = 0, crc32 = null }) {
    this.magic = 'SP';
    this.lsn = Number(lsn);
    this.timestamp = Number(timestamp) || Date.now();
    this.opcode = opcode;
    this.key = key;
    this.value = value;
    this.ttlSeconds = Number(ttlSeconds) || 0;
    
    // If checksum not provided, compute dynamically
    if (crc32) {
      this.crc32 = crc32;
    } else {
      this.crc32 = this.computeChecksum();
    }
  }

  getPayloadToHash() {
    return `${this.magic}|${this.lsn}|${this.timestamp}|${this.opcode}|${this.key}|${JSON.stringify(this.value)}|${this.ttlSeconds}`;
  }

  computeChecksum() {
    return computeCRC32Hex(this.getPayloadToHash());
  }

  verifyChecksum() {
    const computed = this.computeChecksum();
    return this.crc32.toUpperCase() === computed.toUpperCase();
  }

  serialize() {
    return JSON.stringify({
      magic: this.magic,
      lsn: this.lsn,
      timestamp: this.timestamp,
      opcode: this.opcode,
      key: this.key,
      value: this.value,
      ttlSeconds: this.ttlSeconds,
      crc32: this.crc32
    }) + '\n';
  }

  static deserialize(line) {
    if (!line || !line.trim()) return null;
    try {
      const parsed = JSON.parse(line.trim());
      return new WalRecord(parsed);
    } catch (e) {
      return null;
    }
  }
}
