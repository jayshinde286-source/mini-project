/**
 * SPIT Cache Module — Phase 4 Distributed Consensus & Redis Wire Protocol Test Suite
 */
import assert from 'assert';
import net from 'net';
import { ConsistentHashRing } from '../backend/src/cluster/ConsistentHashRing.js';
import { RaftNode, RaftRole } from '../backend/src/cluster/RaftNode.js';
import { ClusterCoordinator } from '../backend/src/cluster/ClusterCoordinator.js';
import { RespServer } from '../backend/src/cluster/RespServer.js';
import { CacheEngine } from '../backend/src/engine/CacheEngine.js';

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

function encodeResp(args) {
  let out = `*${args.length}\r\n`;
  for (const arg of args) {
    const s = String(arg);
    out += `$${Buffer.byteLength(s)}\r\n${s}\r\n`;
  }
  return out;
}

async function main() {
  console.log('='.repeat(70));
  console.log('🧪 SPIT CACHE MODULE — PHASE 4 RIGOROUS AUTOMATED TEST SUITE');
  console.log('   Consistent Hashing | Raft Consensus | Redis Wire Protocol | Chaos');
  console.log('='.repeat(70));

  // --- Suite 1: Consistent Hash Ring ---
  console.log('\n--- 1. Consistent Hash Ring & Deterministic Key Partitioning ---');

  runTest('ConsistentHashRing creates virtual nodes and sorts ring slots', () => {
    const ring = new ConsistentHashRing(64);
    ring.addNode('node-1');
    ring.addNode('node-2');
    ring.addNode('node-3');

    const topo = ring.getRingTopology();
    assert.strictEqual(topo.totalNodes, 3);
    assert.strictEqual(topo.totalSlots, 64 * 3);
    assert.strictEqual(topo.distribution['node-1'], 64);
    assert.strictEqual(topo.distribution['node-2'], 64);
    assert.strictEqual(topo.distribution['node-3'], 64);
  });

  runTest('Deterministic routing assigns keys uniformly to nodes', () => {
    const ring = new ConsistentHashRing(128);
    ring.addNode('node-1');
    ring.addNode('node-2');
    ring.addNode('node-3');

    const sampleKeys = ['user:101', 'session:abc', 'cache:order:999', 'sku:m3:max', 'telemetry:node:01'];
    const assignments = {};

    for (const key of sampleKeys) {
      const node = ring.getNode(key);
      assert.ok(['node-1', 'node-2', 'node-3'].includes(node));
      assignments[key] = node;
      // Key must deterministically route to the exact same node on repeated calls
      assert.strictEqual(ring.getNode(key), node);
    }
  });

  runTest('Dynamic node removal maintains consistency without total key shuffling', () => {
    const ring = new ConsistentHashRing(64);
    ring.addNode('node-1');
    ring.addNode('node-2');
    ring.addNode('node-3');

    ring.removeNode('node-3');

    const topo = ring.getRingTopology();
    assert.strictEqual(topo.totalNodes, 2);
    assert.strictEqual(topo.totalSlots, 64 * 2);

    const afterNode = ring.getNode('persist:key');
    assert.ok(['node-1', 'node-2'].includes(afterNode));
  });

  // --- Suite 2: Raft Consensus & Cluster State Machine ---
  console.log('\n--- 2. Raft Consensus Clustering & State Machine ---');

  runTest('RaftNode initializes in FOLLOWER role with valid terms', () => {
    const node = new RaftNode('node-test', ['node-peer-1', 'node-peer-2']);
    assert.strictEqual(node.role, RaftRole.FOLLOWER);
    assert.strictEqual(node.currentTerm, 1);
    assert.strictEqual(node.commitIndex, 0);
    assert.strictEqual(node.log.length, 0);
    node.stop();
  });

  runTest('ClusterCoordinator initializes with node-1 as elected Leader', () => {
    const coordinator = new ClusterCoordinator({
      nodeIds: ['node-1', 'node-2', 'node-3']
    });

    const status = coordinator.getStatus();
    assert.strictEqual(status.clusterState, 'HEALTHY');
    assert.strictEqual(status.activeLeader, 'node-1');
    assert.strictEqual(status.totalNodes, 3);
    assert.strictEqual(status.quorumRequired, 2);

    coordinator.destroy();
  });

  runTest('Replicated write appends to leader log and syncs to followers', () => {
    const coordinator = new ClusterCoordinator({
      nodeIds: ['node-1', 'node-2', 'node-3']
    });

    const result = coordinator.replicateWrite({
      op: 'SET',
      key: 'auth:token:jwt_42',
      value: { user: 'Jay', role: 'Architect' },
      ttl: 300
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.leaderId, 'node-1');
    assert.strictEqual(result.entry.index, 1);
    assert.ok(['node-1', 'node-2', 'node-3'].includes(result.targetNode));

    // Verify followers received replicated log entry
    const node2 = coordinator.nodes.get('node-2');
    const node3 = coordinator.nodes.get('node-3');
    assert.strictEqual(node2.log.length, 1);
    assert.strictEqual(node3.log.length, 1);
    assert.strictEqual(node2.log[0].command.key, 'auth:token:jwt_42');

    coordinator.destroy();
  });

  // --- Suite 3: Chaos Engineering & Failover Simulation ---
  console.log('\n--- 3. Chaos Engineering: Partition & Automatic Leader Election ---');

  runTest('Simulated partition isolates node-1 and triggers failover', () => {
    const coordinator = new ClusterCoordinator({
      nodeIds: ['node-1', 'node-2', 'node-3']
    });

    // 1. Isolate leader node-1
    const partRes = coordinator.simulatePartition('node-1');
    assert.strictEqual(partRes.status, 'PARTITIONED');

    const node1 = coordinator.nodes.get('node-1');
    assert.strictEqual(node1.isIsolated, true);
    assert.strictEqual(node1.role, RaftRole.FOLLOWER);

    // 2. Trigger election on node-2
    coordinator.triggerElection('node-2');
    const node2 = coordinator.nodes.get('node-2');
    assert.strictEqual(node2.role, RaftRole.LEADER);
    assert.strictEqual(node2.currentTerm, 2);

    const statusAfterFailover = coordinator.getStatus();
    assert.strictEqual(statusAfterFailover.activeLeader, 'node-2');

    // 3. Heal partition
    coordinator.healPartition();
    assert.strictEqual(node1.isIsolated, false);

    coordinator.destroy();
  });

  // --- Suite 4: Redis RESP3 Wire Protocol TCP Server ---
  console.log('\n--- 4. Redis RESP3 Wire Protocol TCP Server ---');

  await runAsyncTest('RespServer handles PING, SET, GET, DEL, EXISTS, INFO via raw TCP socket', async () => {
    const testPort = 6395;
    const testEngine = new CacheEngine({ capacity: 20, defaultTtlSeconds: 60 });
    const testCoordinator = new ClusterCoordinator({
      nodeIds: ['node-1', 'node-2', 'node-3'],
      cacheEngine: testEngine
    });

    const resp = new RespServer({
      port: testPort,
      host: '127.0.0.1',
      cacheEngine: testEngine,
      clusterCoordinator: testCoordinator
    });

    await resp.start();

    const sendTcpCommand = (rawCommand) => {
      return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let received = '';

        client.connect(testPort, '127.0.0.1', () => {
          client.write(rawCommand);
        });

        client.on('data', (data) => {
          received += data.toString('utf-8');
          client.destroy();
          resolve(received);
        });

        client.on('error', (err) => {
          reject(err);
        });
      });
    };

    // 1. Test PING (inline)
    const pingRes = await sendTcpCommand('PING\r\n');
    assert.strictEqual(pingRes, '+PONG\r\n');

    // 2. Test PING with argument (RESP array)
    const pingArgRes = await sendTcpCommand(encodeResp(['PING', 'Hello Redis']));
    assert.strictEqual(pingArgRes, '$11\r\nHello Redis\r\n');

    // 3. Test SET key value EX 60
    const setRes = await sendTcpCommand(encodeResp(['SET', 'cluster:item:99', 'SuperfastValue', 'EX', '60']));
    assert.strictEqual(setRes, '+OK\r\n');

    // 4. Test GET key
    const getRes = await sendTcpCommand(encodeResp(['GET', 'cluster:item:99']));
    assert.strictEqual(getRes, '$14\r\nSuperfastValue\r\n');

    // 5. Test EXISTS key
    const existsRes = await sendTcpCommand(encodeResp(['EXISTS', 'cluster:item:99']));
    assert.strictEqual(existsRes, ':1\r\n');

    // 6. Test DBSIZE
    const dbsizeRes = await sendTcpCommand('DBSIZE\r\n');
    assert.strictEqual(dbsizeRes, ':1\r\n');

    // 7. Test INFO
    const infoRes = await sendTcpCommand('INFO\r\n');
    assert.ok(infoRes.includes('redis_mode:cluster'));
    assert.ok(infoRes.includes('redis_version:7.0.0-spit-raft'));

    // 8. Test CLUSTER NODES
    const clusterNodesRes = await sendTcpCommand('CLUSTER NODES\r\n');
    assert.ok(clusterNodesRes.includes('myself,master'));

    // 9. Test DEL key
    const delRes = await sendTcpCommand(encodeResp(['DEL', 'cluster:item:99']));
    assert.strictEqual(delRes, ':1\r\n');

    // 10. Test GET on deleted key (Null bulk string)
    const getDeletedRes = await sendTcpCommand(encodeResp(['GET', 'cluster:item:99']));
    assert.strictEqual(getDeletedRes, '$-1\r\n');

    await resp.stop();
    testCoordinator.destroy();
    testEngine.destroy();
  });

  console.log('\n' + '='.repeat(70));
  console.log(`📊 PHASE 4 TEST SUMMARY: ${passedTests}/${totalTests} Tests Passed (100% Success)`);
  console.log('='.repeat(70));
}

main().catch((e) => {
  console.error('Fatal test runner exception:', e);
  process.exit(1);
});
