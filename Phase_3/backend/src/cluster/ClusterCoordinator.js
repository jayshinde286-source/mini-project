/**
 * SPIT Cache Module — Phase 4: Cluster Coordinator
 * Orchestrates multi-node Raft consensus, consistent hash ring routing,
 * and chaos engineering partition simulations.
 */
import { RaftNode, RaftRole } from './RaftNode.js';
import { ConsistentHashRing } from './ConsistentHashRing.js';

export class ClusterCoordinator {
  constructor(options = {}) {
    this.nodeIds = options.nodeIds || ['node-1', 'node-2', 'node-3'];
    this.nodes = new Map();
    this.ring = new ConsistentHashRing(options.virtualNodesPerNode || 128);
    this.eventBus = options.eventBus || null;
    this.cacheEngine = options.cacheEngine || null;

    this.clusterEvents = [];
    this.maxEvents = 100;

    this.initCluster();
  }

  logClusterEvent(type, message, details = {}) {
    const evt = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      message,
      timestamp: Date.now(),
      details
    };
    this.clusterEvents.unshift(evt);
    if (this.clusterEvents.length > this.maxEvents) {
      this.clusterEvents.pop();
    }
    if (this.eventBus) {
      this.eventBus.publish('CLUSTER_EVENT', evt);
    }
  }

  initCluster() {
    // 1. Add all nodes to Consistent Hash Ring
    for (const id of this.nodeIds) {
      this.ring.addNode(id);
    }

    // 2. Instantiate RaftNode for each physical node
    for (const id of this.nodeIds) {
      const peers = this.nodeIds.filter((p) => p !== id);
      const node = new RaftNode(id, peers, {
        heartbeatIntervalMs: 200,
        electionTimeoutMs: 600
      });
      this.nodes.set(id, node);
      this.setupNodeWiring(node);
    }

    // 3. Set node-1 as initial elected LEADER (term 1)
    const leader = this.nodes.get('node-1');
    if (leader) {
      leader.becomeLeader();
      this.logClusterEvent('CLUSTER_BOOT', 'Cluster initialized with 3 Raft nodes. node-1 elected Leader.', {
        nodes: this.nodeIds,
        leaderId: 'node-1',
        term: leader.currentTerm
      });
    }

    // Start election timers for followers
    for (const [id, node] of this.nodes.entries()) {
      if (id !== 'node-1') {
        node.start();
      }
    }
  }

  setupNodeWiring(node) {
    // Wire RPC: AppendEntries (Heartbeats & Log replication)
    node.on('send_append_entries', (rpc) => {
      if (node.isIsolated) return;
      const peer = this.nodes.get(rpc.to);
      if (peer && !peer.isIsolated) {
        peer.handleAppendEntries(rpc);
      }
    });

    // Wire RPC: RequestVote
    node.on('send_request_vote', (rpc) => {
      if (node.isIsolated) return;
      const peer = this.nodes.get(rpc.to);
      if (peer && !peer.isIsolated) {
        // Peer evaluates candidate request
        if (rpc.term > peer.currentTerm && (!peer.votedFor || peer.votedFor === rpc.candidateId)) {
          peer.currentTerm = rpc.term;
          peer.role = RaftRole.FOLLOWER;
          peer.votedFor = rpc.candidateId;
          peer.resetElectionTimer();
          node.receiveVoteGrant(peer.nodeId, rpc.term);
          this.logClusterEvent('VOTE_GRANTED', `${peer.nodeId} granted vote to ${rpc.candidateId} for Term ${rpc.term}`);
        }
      }
    });

    // Node state transitions
    node.on('leader_elected', (data) => {
      this.logClusterEvent('LEADER_ELECTED', `New cluster leader elected: ${data.leaderId} (Term ${data.term})`, data);
    });

    node.on('election_started', (data) => {
      this.logClusterEvent('ELECTION_START', `${data.nodeId} timed out and initiated election for Term ${data.term}`, data);
    });
  }

  getLeader() {
    for (const [, node] of this.nodes.entries()) {
      if (node.role === RaftRole.LEADER && !node.isIsolated) {
        return node;
      }
    }
    return null;
  }

  replicateWrite(command) {
    const leader = this.getLeader();
    if (!leader) {
      throw new Error('CLUSTER_UNAVAILABLE: No active quorum leader available to accept write');
    }

    // 1. Determine key ownership in Consistent Hash Ring
    const key = command.key;
    const targetNode = key ? this.ring.getNode(key) : leader.nodeId;

    // 2. Append to Raft Leader replicated log
    const entry = leader.appendClientCommand({
      ...command,
      assignedNode: targetNode
    });

    // 3. Replicate entry to connected followers
    for (const peerId of leader.peerIds) {
      const peer = this.nodes.get(peerId);
      if (peer && !peer.isIsolated) {
        peer.handleAppendEntries({
          term: leader.currentTerm,
          leaderId: leader.nodeId,
          prevLogIndex: leader.log.length - 1,
          prevLogTerm: leader.currentTerm,
          entries: [entry],
          leaderCommit: leader.commitIndex
        });
      }
    }

    // 4. If engine is bound, apply write to memory cache
    let cacheResult = null;
    if (this.cacheEngine) {
      if (command.op === 'SET' || command.op === 'PUT') {
        cacheResult = this.cacheEngine.put(command.key, command.value, command.ttl);
      } else if (command.op === 'DEL') {
        cacheResult = this.cacheEngine.delete(command.key);
      }
    }

    this.logClusterEvent('RAFT_COMMIT', `Command ${command.op} [${key || '*'}] committed at LSN ${entry.index} (Term ${entry.term})`, {
      entry,
      targetNode
    });

    return {
      success: true,
      entry,
      targetNode,
      leaderId: leader.nodeId,
      term: leader.currentTerm,
      cacheResult
    };
  }

  simulatePartition(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    node.isIsolated = true;
    if (node.role === RaftRole.LEADER) {
      node.role = RaftRole.FOLLOWER;
      if (node.heartbeatTimer) clearInterval(node.heartbeatTimer);
    }

    this.logClusterEvent('CHAOS_PARTITION', `Network partition injected: ${nodeId} is isolated from quorum.`, {
      nodeId,
      isolated: true
    });

    return {
      status: 'PARTITIONED',
      isolatedNode: nodeId,
      message: `Node ${nodeId} isolated. Remaining nodes will detect heartbeat loss and trigger leader election.`
    };
  }

  healPartition(nodeId = null) {
    if (nodeId) {
      const node = this.nodes.get(nodeId);
      if (node) {
        node.isIsolated = false;
        node.resetElectionTimer();
      }
    } else {
      for (const [, node] of this.nodes.entries()) {
        node.isIsolated = false;
        node.resetElectionTimer();
      }
    }

    this.logClusterEvent('CHAOS_HEALED', nodeId ? `Partition healed for ${nodeId}` : 'Cluster network partition healed across all nodes.', {
      nodeId: nodeId || 'ALL'
    });

    return {
      status: 'HEALED',
      message: 'Network partitions healed. Heartbeats and consensus restored.'
    };
  }

  triggerElection(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);
    node.handleElectionTimeout();
    return {
      status: 'ELECTION_TRIGGERED',
      nodeId,
      term: node.currentTerm,
      role: node.role
    };
  }

  getStatus() {
    const nodesList = [];
    let currentLeader = null;

    for (const [id, node] of this.nodes.entries()) {
      const st = node.getStatus();
      if (st.role === RaftRole.LEADER && !st.isIsolated) {
        currentLeader = id;
      }
      nodesList.push(st);
    }

    return {
      clusterState: currentLeader ? 'HEALTHY' : 'DEGRADED',
      activeLeader: currentLeader,
      totalNodes: this.nodeIds.length,
      quorumRequired: Math.floor(this.nodeIds.length / 2) + 1,
      nodes: nodesList,
      recentEvents: this.clusterEvents.slice(0, 15)
    };
  }

  getRingTopology() {
    return this.ring.getRingTopology();
  }

  routeKey(key) {
    const targetNode = this.ring.getNode(key);
    const hash = this.ring.hash(key);
    return {
      key,
      hash,
      slot: hash % 1024,
      targetNode,
      clusterLeader: this.getLeader()?.nodeId || null
    };
  }

  destroy() {
    for (const [, node] of this.nodes.entries()) {
      node.stop();
    }
  }
}
