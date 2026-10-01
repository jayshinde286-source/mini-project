/**
 * WalManager
 * Handles append-only disk logging, synchronous fsyncing, sequential scanning,
 * and log compaction/truncation.
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { WalRecord, OpCode } from './WalRecord.js';

export class WalManager {
  constructor(filePath, syncToDisk = true) {
    this.filePath = path.resolve(filePath);
    this.syncToDisk = syncToDisk;
    this.currentLsn = 0;
    this.fileDescriptor = null;

    // Ensure parent directory exists
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.init();
  }

  init() {
    // Open or create file for appending with strict 0o600 permissions (read/write only by owner)
    this.fileDescriptor = fs.openSync(this.filePath, 'a+', 0o600);
    try {
      fs.chmodSync(this.filePath, 0o600);
    } catch (e) {}
    this.scanCurrentLsn();
  }

  scanCurrentLsn() {
    if (!fs.existsSync(this.filePath)) {
      this.currentLsn = 0;
      return;
    }

    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const lines = content.trim().split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const record = WalRecord.deserialize(lines[i]);
        if (record && !isNaN(record.lsn)) {
          this.currentLsn = Math.max(this.currentLsn, record.lsn);
          break;
        }
      }
    } catch (e) {
      console.warn('Warning: Could not scan last LSN:', e.message);
    }
  }

  /**
   * Appends an operation record to the WAL file.
   * Returns the assigned LSN.
   */
  append(opcode, key, value = null, ttlSeconds = 0) {
    this.currentLsn += 1;
    const record = new WalRecord({
      lsn: this.currentLsn,
      timestamp: Date.now(),
      opcode,
      key,
      value,
      ttlSeconds
    });

    const serialized = record.serialize();
    fs.writeSync(this.fileDescriptor, serialized);
    if (this.syncToDisk) {
      fs.fdatasyncSync(this.fileDescriptor);
    }

    return record;
  }

  /**
   * Reads all records from the log sequentially.
   */
  readAllRecords() {
    if (!fs.existsSync(this.filePath)) return [];

    const content = fs.readFileSync(this.filePath, 'utf-8');
    const lines = content.split('\n');
    const records = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const record = WalRecord.deserialize(line);
      if (record) {
        records.push(record);
      }
    }
    return records;
  }

  /**
   * Log Compaction: Truncates records prior to checkpoint LSN.
   */
  truncateBeforeLsn(checkpointLsn) {
    if (!fs.existsSync(this.filePath)) return;

    const all = this.readAllRecords();
    const remaining = all.filter(r => r.lsn >= checkpointLsn);

    // Close descriptor before rewrite
    if (this.fileDescriptor) {
      fs.closeSync(this.fileDescriptor);
    }

    const tempFile = `${this.filePath}.tmp`;
    const data = remaining.map(r => r.serialize()).join('');
    fs.writeFileSync(tempFile, data, 'utf-8');
    fs.renameSync(tempFile, this.filePath);

    // Reopen descriptor
    this.fileDescriptor = fs.openSync(this.filePath, 'a+');
  }

  getFileSize() {
    try {
      const stats = fs.statSync(this.filePath);
      return stats.size;
    } catch (e) {
      return 0;
    }
  }

  close() {
    if (this.fileDescriptor) {
      fs.closeSync(this.fileDescriptor);
      this.fileDescriptor = null;
    }
  }
}
