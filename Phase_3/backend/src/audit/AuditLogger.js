/**
 * AuditLogger
 * Cryptographically tamper-evident, append-only audit trail with SHA-256 hash-chaining
 * and POSIX 0o600 access control enforcement for SPIT Cache Module.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class AuditLogger {
  static GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

  constructor(filePath) {
    this.filePath = path.resolve(filePath);
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }

    this.lastHash = AuditLogger.GENESIS_HASH;
    this.totalEntries = 0;
    this.init();
  }

  init() {
    // Ensure file exists with strict 0o600 permissions (read/write only by owner process)
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '', { mode: 0o600 });
    } else {
      try {
        fs.chmodSync(this.filePath, 0o600);
      } catch (e) {}
      this.migrateLegacyLogs();
      this.recoverLastHash();
    }
  }

  migrateLegacyLogs() {
    if (!fs.existsSync(this.filePath)) return;
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(l => l.trim().length > 0);
      let needsMigration = false;

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (!entry.hash || !entry.prevHash) {
            needsMigration = true;
            break;
          }
        } catch (e) {}
      }

      if (needsMigration) {
        let prevHash = AuditLogger.GENESIS_HASH;
        const newLines = [];
        let seq = 0;
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            seq++;
            entry.sequence = seq;
            entry.prevHash = prevHash;
            entry.hash = this.computeHash(prevHash, entry.timestamp, entry.action, entry.target, entry.actor, entry.metadata);
            prevHash = entry.hash;
            newLines.push(JSON.stringify(entry));
          } catch (e) {}
        }
        fs.writeFileSync(this.filePath, newLines.join('\n') + '\n', { encoding: 'utf-8', mode: 0o600 });
        this.lastHash = prevHash;
        this.totalEntries = seq;
      }
    } catch (e) {}
  }

  /**
   * Scans the log to retrieve the last verified cryptographic block hash
   */
  recoverLastHash() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const lines = content.trim().split('\n');
      let count = 0;

      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        count++;
        try {
          const entry = JSON.parse(line);
          if (entry.hash && typeof entry.hash === 'string') {
            this.lastHash = entry.hash;
            break;
          }
        } catch (e) {}
      }
      this.totalEntries = count;
    } catch (e) {
      this.lastHash = AuditLogger.GENESIS_HASH;
    }
  }

  /**
   * Computes SHA-256 block hash for an audit record
   */
  computeHash(prevHash, timestamp, action, target, actor, metadata) {
    const payload = `${prevHash}|${timestamp}|${action}|${target}|${actor}|${JSON.stringify(metadata || {})}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Appends an immutable, hash-chained entry to audit log
   */
  log(action, target, actor = 'SYSTEM', metadata = {}) {
    const timestamp = new Date().toISOString();
    const prevHash = this.lastHash;
    const hash = this.computeHash(prevHash, timestamp, action, target, actor, metadata);

    const entry = {
      sequence: ++this.totalEntries,
      timestamp,
      action,
      target: String(target),
      actor,
      metadata,
      prevHash,
      hash
    };

    const line = JSON.stringify(entry) + '\n';
    try {
      fs.appendFileSync(this.filePath, line, { encoding: 'utf-8', mode: 0o600 });
      this.lastHash = hash;
    } catch (e) {
      console.error('Security Alert: Failed to append to audit log:', e.message);
    }

    return entry;
  }

  /**
   * Reads recent audit logs
   */
  readLogs(limit = 100) {
    if (!fs.existsSync(this.filePath)) return [];

    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const lines = content.trim().split('\n');
      const logs = [];

      for (let i = lines.length - 1; i >= 0 && logs.length < limit; i--) {
        if (!lines[i].trim()) continue;
        try {
          logs.push(JSON.parse(lines[i]));
        } catch (e) {}
      }
      return logs;
    } catch (e) {
      return [];
    }
  }

  /**
   * Mathematically verifies the cryptographic integrity of the entire audit chain.
   * Returns verification report confirming zero tampering.
   */
  verifyChainIntegrity() {
    if (!fs.existsSync(this.filePath)) {
      return { valid: true, totalRecords: 0, message: 'Audit log is empty' };
    }

    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(l => l.trim().length > 0);

      let expectedPrevHash = AuditLogger.GENESIS_HASH;

      for (let idx = 0; idx < lines.length; idx++) {
        let entry;
        try {
          entry = JSON.parse(lines[idx]);
        } catch (e) {
          return {
            valid: false,
            corruptedIndex: idx,
            message: `JSON format corruption detected at record ${idx + 1}`
          };
        }

        // Verify prevHash linkage
        if (entry.prevHash !== expectedPrevHash) {
          return {
            valid: false,
            corruptedIndex: idx,
            message: `Chain linkage mismatch at record ${idx + 1}: expected prevHash ${expectedPrevHash}, found ${entry.prevHash}`
          };
        }

        // Verify current hash computation
        const recalculated = this.computeHash(
          entry.prevHash,
          entry.timestamp,
          entry.action,
          entry.target,
          entry.actor,
          entry.metadata
        );

        if (recalculated !== entry.hash) {
          return {
            valid: false,
            corruptedIndex: idx,
            message: `Cryptographic SHA-256 tampering detected at record ${idx + 1} (${entry.action} on ${entry.target})`
          };
        }

        expectedPrevHash = entry.hash;
      }

      return {
        valid: true,
        totalRecords: lines.length,
        headHash: expectedPrevHash,
        verifiedAt: new Date().toISOString(),
        algorithm: 'SHA-256 Chain Verification',
        status: 'TAMPER_PROOF_VERIFIED'
      };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }
}
