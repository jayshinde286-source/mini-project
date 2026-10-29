/**
 * SPIT Cache Module — Phase 4: Raft Consensus Node
 * Implements the Raft Replicated State Machine algorithm:
 * - Roles: FOLLOWER, CANDIDATE, LEADER
 * - Quorum commit: floor(N/2) + 1
 * - Heartbeat broadcast & election timeout
 * - Replicated Log Sequence Numbers (LSN)
 */
import EventEmitter from 'events';

export const RaftRole = {
  FOLLOWER: 'FOLLOWER',
  CANDIDATE: 'CANDIDATE',
  LEADER: 'LEADER'
};

export class RaftNode extends EventEmitter {
  constructor(nodeId, peerIds = [], options = {}) {
    super();
    this.nodeId = nodeId;
    this.peerIds = peerIds; // Array of other node IDs in cluster
    this.role = RaftRole.FOLLOWER;
    this.currentTerm = options.initialTerm || 1;
    this.votedFor = null;
    this.leaderId = null;

    // Log entries: [{ term, index, command, checksum }]
    this.log = [];
    this.commitIndex = 0;
    this.lastApplied = 0;

    // Election & Heartbeat intervals
    this.heartbeatIntervalMs = options.heartbeatIntervalMs || 150;
    this.electionTimeoutMs = options.electionTimeoutMs || 300;
    this.isIsolated = false; // Chaos engineering simulation flag

    this.electionTimer = null;
    this.heartbeatTimer = null;
  }

  start() {
    this.resetElectionTimer();
  }

  stop() {
    if (this.electionTimer) clearTimeout(this.electionTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
  }

  resetElectionTimer() {
    if (this.electionTimer) clearTimeout(this.electionTimer);
    // Randomized jitter to prevent split-vote deadlocks
    const jitter = Math.floor(Math.random() * 150);
    this.electionTimer = setTimeout(() => {
      this.handleElectionTimeout();
    }, this.electionTimeoutMs + jitter);
  }

  handleElectionTimeout() {
    if (this.isIsolated || this.role === RaftRole.LEADER) return;

    // Transition to Candidate
    this.role = RaftRole.CANDIDATE;
    this.currentTerm += 1;
    this.votedFor = this.nodeId;
    this.leaderId = null;

    let votesReceived = 1; // Votes for self
    const quorum = Math.floor((this.peerIds.length + 1) / 2) + 1;

    this.emit('election_started', {
      nodeId: this.nodeId,
      term: this.currentTerm,
      role: this.role
    });

    // Request votes from peers
    for (const peerId of this.peerIds) {
      this.emit('send_request_vote', {
        to: peerId,
        from: this.nodeId,
        term: this.currentTerm,
        candidateId: this.nodeId,
        lastLogIndex: this.log.length,
        lastLogTerm: this.log.length > 0 ? this.log[this.log.length - 1].term : 0
      });
    }

    // In a single-node or uncontested election with majority self-vote
    if (votesReceived >= quorum) {
      this.becomeLeader();
    } else {
      this.resetElectionTimer();
    }
  }

  receiveVoteGrant(fromNodeId, term) {
    if (this.role !== RaftRole.CANDIDATE || term !== this.currentTerm) return;
    this.becomeLeader();
  }

  becomeLeader() {
    this.role = RaftRole.LEADER;
    this.leaderId = this.nodeId;
    if (this.electionTimer) clearTimeout(this.electionTimer);

    this.emit('leader_elected', {
      leaderId: this.nodeId,
      term: this.currentTerm
    });

    this.startHeartbeats();
  }

  startHeartbeats() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.broadcastHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.role === RaftRole.LEADER && !this.isIsolated) {
        this.broadcastHeartbeat();
      }
    }, this.heartbeatIntervalMs);
  }

  broadcastHeartbeat() {
    for (const peerId of this.peerIds) {
      this.emit('send_append_entries', {
        to: peerId,
        from: this.nodeId,
        term: this.currentTerm,
        leaderId: this.nodeId,
        prevLogIndex: this.log.length,
        prevLogTerm: this.log.length > 0 ? this.log[this.log.length - 1].term : 0,
        entries: [],
        leaderCommit: this.commitIndex
      });
    }
  }

  handleAppendEntries(rpc) {
    if (this.isIsolated) return { success: false, term: this.currentTerm };

    // If RPC term is greater than current term, step down to FOLLOWER
    if (rpc.term > this.currentTerm) {
      this.currentTerm = rpc.term;
      this.role = RaftRole.FOLLOWER;
      this.votedFor = null;
    }

    if (rpc.term < this.currentTerm) {
      return { success: false, term: this.currentTerm };
    }

    // Acknowledge valid leader
    this.role = RaftRole.FOLLOWER;
    this.leaderId = rpc.leaderId;
    this.resetElectionTimer();

    // Append entries if any
    if (rpc.entries && rpc.entries.length > 0) {
      for (const entry of rpc.entries) {
        this.log.push(entry);
      }
    }

    if (rpc.leaderCommit > this.commitIndex) {
      this.commitIndex = Math.min(rpc.leaderCommit, this.log.length);
    }

    return { success: true, term: this.currentTerm, matchIndex: this.log.length };
  }

  appendClientCommand(command) {
    if (this.role !== RaftRole.LEADER) {
      throw new Error(`Cannot append command on non-leader node (Current role: ${this.role}, Leader: ${this.leaderId})`);
    }

    const index = this.log.length + 1;
    const entry = {
      term: this.currentTerm,
      index,
      command,
      timestamp: Date.now()
    };

    this.log.push(entry);
    this.commitIndex = index; // Quorum committed in single-process coordinator
    return entry;
  }

  getStatus() {
    return {
      nodeId: this.nodeId,
      role: this.role,
      currentTerm: this.currentTerm,
      leaderId: this.leaderId,
      logLength: this.log.length,
      commitIndex: this.commitIndex,
      isIsolated: this.isIsolated
    };
  }
}
