/**
 * SPIT Cache Module — Phase 3 Automated Test Suite
 * Tests Core In-Memory Engine, LRU Eviction, TTL Expiry, WAL CRC32, and Crash Recovery.
 */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { CacheEngine } from '../backend/src/engine/CacheEngine.js';
import { DoublyLinkedList } from '../backend/src/engine/DoublyLinkedList.js';
import { CacheNode } from '../backend/src/engine/CacheNode.js';
import { WalManager } from '../backend/src/wal/WalManager.js';
import { WalRecord, OpCode } from '../backend/src/wal/WalRecord.js';
import { SnapshotStore } from '../backend/src/snapshot/SnapshotStore.js';
import { RecoveryManager } from '../backend/src/recovery/RecoveryManager.js';
import { EventBus } from '../backend/src/events/EventBus.js';
import { computeCRC32Hex } from '../backend/src/utils/crc32.js';
import { SecurityGuard } from '../backend/src/security/SecurityGuard.js';
import { RateLimiter } from '../backend/src/security/RateLimiter.js';
import { AuditLogger } from '../backend/src/audit/AuditLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbDir = path.resolve(__dirname, './scratch_db');

if (fs.existsSync(testDbDir)) {
  fs.rmSync(testDbDir, { recursive: true, force: true });
}
fs.mkdirSync(testDbDir, { recursive: true });

let totalTests = 0;
let passedTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${description}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    ${err.message}`);
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🧪 Running SPIT Cache Module Phase 3 Test Suite');
  console.log('======================================================\n');

  // Test Suite 1: Doubly-Linked List & LRU
  console.log('--- Suite 1: Doubly-Linked List & Node Splicing ---');
  it('should initialize empty DoublyLinkedList with head and tail sentinels', () => {
    const dll = new DoublyLinkedList();
    assert.strictEqual(dll.size, 0);
    assert.strictEqual(dll.head.next, dll.tail);
    assert.strictEqual(dll.tail.prev, dll.head);
  });

  it('should add nodes to head and remove tail in O(1)', () => {
    const dll = new DoublyLinkedList();
    const n1 = new CacheNode('k1', 'v1');
    const n2 = new CacheNode('k2', 'v2');
    dll.addToHead(n1);
    dll.addToHead(n2);
    assert.strictEqual(dll.size, 2);
    assert.strictEqual(dll.head.next.key, 'k2'); // Most recent
    const victim = dll.removeTail();
    assert.strictEqual(victim.key, 'k1'); // Oldest
    assert.strictEqual(dll.size, 1);
  });

  // Test Suite 2: Cache Operations & Eviction
  console.log('\n--- Suite 2: In-Memory Cache Engine & LRU Eviction ---');
  const walFile = path.join(testDbDir, 'test_wal.log');
  const snapshotFile = path.join(testDbDir, 'test_snapshot.bin');
  const walManager = new WalManager(walFile, false);
  const snapshotStore = new SnapshotStore(snapshotFile);
  const eventBus = new EventBus(100);

  const engine = new CacheEngine({
    capacity: 3, // Small capacity to force eviction
    defaultTtlSeconds: 10,
    walManager,
    eventBus
  });

  it('should put and get values in O(1)', () => {
    engine.put('user:1', { name: 'Alice' }, 10);
    const val = engine.get('user:1');
    assert.deepStrictEqual(val, { name: 'Alice' });
  });

  it('should evict LRU item when capacity is exceeded', () => {
    engine.put('user:2', 'Bob');
    engine.put('user:3', 'Charlie');
    // Access user:1 so it becomes MRU; user:2 is now oldest
    engine.get('user:1');
    // Inserting user:4 should evict user:2
    engine.put('user:4', 'Diana');

    assert.strictEqual(engine.index.size, 3);
    assert.strictEqual(engine.get('user:2'), null); // Evicted!
    assert.notStrictEqual(engine.get('user:1'), null);
    assert.notStrictEqual(engine.get('user:3'), null);
    assert.notStrictEqual(engine.get('user:4'), null);
  });

  it('should passively expire keys past TTL', () => {
    // Insert with 1 millisecond TTL (simulated immediate expiry)
    const node = new CacheNode('temp:key', 'quick', 0);
    node.expiresAt = Date.now() - 100; // already expired
    engine.dll.addToHead(node);
    engine.index.set('temp:key', node);

    const result = engine.get('temp:key');
    assert.strictEqual(result, null);
    assert.strictEqual(engine.index.has('temp:key'), false); // Lazy purged!
  });

  // Test Suite 3: Write-Ahead Logging & CRC32
  console.log('\n--- Suite 3: Write-Ahead Logging & CRC32 Integrity ---');
  it('should calculate valid 32-bit CRC checksum', () => {
    const crc = computeCRC32Hex('test payload');
    assert.strictEqual(typeof crc, 'string');
    assert.strictEqual(crc.length, 8);
  });

  it('should verify WalRecord integrity', () => {
    const record = new WalRecord({
      lsn: 10,
      timestamp: Date.now(),
      opcode: OpCode.SET,
      key: 'token:abc',
      value: 'secret-val'
    });
    assert.strictEqual(record.verifyChecksum(), true);

    // Tamper with value
    record.value = 'tampered-val';
    assert.strictEqual(record.verifyChecksum(), false);
  });

  // Test Suite 4: Snapshot & Crash Recovery
  console.log('\n--- Suite 4: Snapshot Creation & Two-Phase Crash Recovery ---');
  it('should create point-in-time snapshot and verify contents', () => {
    const snapInfo = snapshotStore.saveSnapshot(engine.index, walManager.currentLsn);
    assert.strictEqual(snapInfo.entryCount >= 3, true);
    assert.strictEqual(snapshotStore.exists(), true);

    const loaded = snapshotStore.loadSnapshot();
    assert.notStrictEqual(loaded, null);
    assert.strictEqual(loaded.checkpointLsn, snapInfo.checkpointLsn);
  });

  it('should perform two-phase recovery reconstituting state', () => {
    // Insert extra mutation after snapshot
    engine.put('post:snapshot:1', 'Survived Crash!', 60);

    // Simulate crash by wiping memory
    engine.clearDirectly();
    assert.strictEqual(engine.index.size, 0);

    // Execute Recovery
    const recoveryManager = new RecoveryManager(engine, walManager, snapshotStore, eventBus);
    const summary = recoveryManager.performRecovery();

    assert.strictEqual(summary.snapshotFound, true);
    assert.strictEqual(summary.restoredFromSnapshotCount >= 3, true);
    assert.strictEqual(summary.replayedFromWalCount >= 1, true);

    // Verify key reconstituted
    assert.strictEqual(engine.get('post:snapshot:1'), 'Survived Crash!');
  });

  // Test Suite 5: SecurityGuard & Input Defense
  console.log('\n--- Suite 5: SecurityGuard & Input Defense ---');
  it('should reject prototype pollution attempts (__proto__, constructor)', () => {
    assert.throws(() => SecurityGuard.validateKey('__proto__'), /prototype pollution/);
    assert.throws(() => SecurityGuard.validateKey('constructor'), /prototype pollution/);
  });

  it('should reject path traversal and null bytes in keys', () => {
    assert.throws(() => SecurityGuard.validateKey('../../etc/passwd'), /traversal/);
    assert.throws(() => SecurityGuard.validateKey('user\0admin'), /traversal/);
  });

  it('should reject payload exceeding 2MB maximum limit', () => {
    const huge = Buffer.alloc(2.5 * 1024 * 1024, 'z').toString();
    assert.throws(() => SecurityGuard.validateValue(huge), /exceeds maximum limit/);
  });

  // Test Suite 6: Sliding-Window IP Rate Limiter
  console.log('\n--- Suite 6: Sliding-Window IP Rate Limiter ---');
  it('should throttle requests when limit is exceeded', () => {
    const limiter = new RateLimiter({ windowMs: 10000, maxRequests: 3, burstMax: 5 });
    assert.strictEqual(limiter.check('10.0.0.1').allowed, true);
    assert.strictEqual(limiter.check('10.0.0.1').allowed, true);
    assert.strictEqual(limiter.check('10.0.0.1').allowed, true);
    assert.strictEqual(limiter.check('10.0.0.1').allowed, false);
    limiter.destroy();
  });

  // Test Suite 7: Tamper-Evident SHA-256 Audit Log Chaining
  console.log('\n--- Suite 7: Cryptographic SHA-256 Audit Chaining ---');
  it('should maintain verified cryptographic hash-chain and detect tampering', () => {
    const auditFile = path.join(testDbDir, 'test_chain_audit.log');
    const audit = new AuditLogger(auditFile);
    audit.log('PUT', 'k1', 'CLIENT', { v: 100 });
    audit.log('GET', 'k1', 'CLIENT', {});

    const report = audit.verifyChainIntegrity();
    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.status, 'TAMPER_PROOF_VERIFIED');

    // Simulate tampering
    const lines = fs.readFileSync(auditFile, 'utf-8').trim().split('\n');
    const modified = JSON.parse(lines[0]);
    modified.target = 'ILLEGALLY_ALTERED';
    lines[0] = JSON.stringify(modified);
    fs.writeFileSync(auditFile, lines.join('\n') + '\n', 'utf-8');

    const tamperedReport = audit.verifyChainIntegrity();
    assert.strictEqual(tamperedReport.valid, false);
    assert.strictEqual(tamperedReport.corruptedIndex, 0);
  });

  // Test Suite 8: Advanced Benchmarking, Hot-Keys & Tiered Storage
  console.log('\n--- Suite 8: Concurrency Benchmarking & Hot-Keys ---');
  it('should run concurrency benchmark measuring microsecond latencies', async () => {
    const report = await engine.runBenchmark({ operations: 50, readRatio: 0.8 });
    assert.strictEqual(report.status, 'BENCHMARK_COMPLETE');
    assert.strictEqual(report.totalOperations, 50);
    assert.strictEqual(typeof report.latencyUs.p50Us, 'number');
    assert.strictEqual(report.throughputOpsPerSec > 0, true);
  });

  it('should return top hot keys sorted by frequency', () => {
    // k1 was accessed multiple times
    const hotkeys = engine.getHotKeys(5);
    assert.strictEqual(Array.isArray(hotkeys), true);
    assert.strictEqual(hotkeys.length > 0, true);
    assert.strictEqual(typeof hotkeys[0].accessCount, 'number');
  });

  it('should compute tiered storage latency savings', () => {
    const tiered = engine.getTieredStorageStats();
    assert.strictEqual(typeof tiered.telemetry.speedupMultiplier, 'string');
    assert.strictEqual(typeof tiered.telemetry.timeSavedMs, 'number');
  });

  console.log('\n======================================================');
  console.log(`📊 Test Results: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('======================================================\n');

  // Clean up test DB
  engine.destroy();
  walManager.close();
  try {
    fs.rmSync(testDbDir, { recursive: true, force: true });
  } catch (e) {}

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllTests();
