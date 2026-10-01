/**
 * Enterprise Security & Cryptographic Integrity Tests
 * Validates SecurityGuard, RateLimiter, and SHA-256 Audit Chain Verification.
 */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { SecurityGuard } from '../backend/src/security/SecurityGuard.js';
import { RateLimiter } from '../backend/src/security/RateLimiter.js';
import { AuditLogger } from '../backend/src/audit/AuditLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDataDir = path.join(__dirname, 'test_security_data');

if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

function runSecurityTests() {
  console.log('\n======================================================');
  console.log('🛡️ Running Enterprise Security & Cryptographic Test Suite');
  console.log('======================================================');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    ${err.message}`);
    }
  }

  // Suite 1: SecurityGuard Key & Payload Protection
  console.log('\n--- Suite 1: SecurityGuard Protection ---');

  test('should validate safe alphanumeric and delimited keys', () => {
    const validKeys = ['user:1001', 'session_token', 'orders/v1/item#4', 'cache.test-key'];
    for (const k of validKeys) {
      assert.strictEqual(SecurityGuard.validateKey(k), k);
    }
  });

  test('should reject prototype pollution attempts (__proto__, constructor)', () => {
    assert.throws(() => SecurityGuard.validateKey('__proto__'), /prototype pollution/);
    assert.throws(() => SecurityGuard.validateKey('constructor'), /prototype pollution/);
    assert.throws(() => SecurityGuard.validateKey('prototype'), /prototype pollution/);
  });

  test('should reject path traversal and null byte injections', () => {
    assert.throws(() => SecurityGuard.validateKey('../secret.txt'), /traversal/);
    assert.throws(() => SecurityGuard.validateKey('user\0admin'), /traversal/);
  });

  test('should reject empty or oversized keys (> 256 chars)', () => {
    assert.throws(() => SecurityGuard.validateKey(''), /empty/);
    assert.throws(() => SecurityGuard.validateKey('a'.repeat(257)), /maximum permitted length/);
  });

  test('should reject oversized payloads (> 2MB)', () => {
    const hugeBuffer = Buffer.alloc(2.5 * 1024 * 1024, 'x').toString();
    assert.throws(() => SecurityGuard.validateValue(hugeBuffer), /exceeds maximum limit/);
  });

  test('should reject invalid or negative TTL values', () => {
    assert.throws(() => SecurityGuard.validateTtl(-10), /non-negative/);
    assert.throws(() => SecurityGuard.validateTtl(NaN), /finite number/);
    assert.strictEqual(SecurityGuard.validateTtl(3600), 3600);
  });

  // Suite 2: RateLimiter Sliding-Window DoS Defense
  console.log('\n--- Suite 2: RateLimiter Sliding Window ---');

  test('should allow requests within limit and track remaining quota', () => {
    const limiter = new RateLimiter({ windowMs: 10000, maxRequests: 5, burstMax: 10 });
    const ip = '192.168.1.50';

    for (let i = 0; i < 5; i++) {
      const check = limiter.check(ip);
      assert.strictEqual(check.allowed, true);
    }

    const blockedCheck = limiter.check(ip);
    assert.strictEqual(blockedCheck.allowed, false);
    assert.strictEqual(blockedCheck.reason, 'Window rate limit exceeded');
    limiter.destroy();
  });

  // Suite 3: SHA-256 Cryptographic Hash-Chain Verification
  console.log('\n--- Suite 3: Tamper-Evident SHA-256 Audit Chaining ---');

  test('should create valid SHA-256 hash-chain and verify 100% integrity', () => {
    const auditFile = path.join(testDataDir, 'clean_audit.log');
    if (fs.existsSync(auditFile)) fs.unlinkSync(auditFile);

    const audit = new AuditLogger(auditFile);
    audit.log('SET', 'user:1', 'API', { role: 'admin' });
    audit.log('GET', 'user:1', 'CLIENT', {});
    audit.log('UPDATE', 'user:1', 'API', { role: 'superuser' });

    const report = audit.verifyChainIntegrity();
    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.totalRecords, 3);
    assert.strictEqual(report.status, 'TAMPER_PROOF_VERIFIED');
  });

  test('should detect tampering if an attacker modifies a past audit entry', () => {
    const auditFile = path.join(testDataDir, 'tampered_audit.log');
    if (fs.existsSync(auditFile)) fs.unlinkSync(auditFile);

    const audit = new AuditLogger(auditFile);
    audit.log('SET', 'account:101', 'API', { balance: 1000 });
    audit.log('SET', 'account:102', 'API', { balance: 5000 });
    audit.log('SET', 'account:103', 'API', { balance: 250 });

    // Attacker modifies record 2 secretly on disk
    const content = fs.readFileSync(auditFile, 'utf-8');
    const lines = content.trim().split('\n');
    const tampered = JSON.parse(lines[1]);
    tampered.metadata.balance = 999999999; // Unauthorized modification!
    lines[1] = JSON.stringify(tampered);
    fs.writeFileSync(auditFile, lines.join('\n') + '\n', 'utf-8');

    // Verification must catch the tampering
    const auditChecker = new AuditLogger(auditFile);
    const report = auditChecker.verifyChainIntegrity();
    assert.strictEqual(report.valid, false);
    assert.strictEqual(report.corruptedIndex, 1);
    assert.ok(report.message.includes('SHA-256 tampering detected'));
  });

  console.log('\n======================================================');
  console.log(`📊 Security Test Results: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('======================================================\n');

  // Clean test dir
  try {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  } catch (e) {}

  if (passed !== total) {
    process.exit(1);
  }
}

runSecurityTests();
