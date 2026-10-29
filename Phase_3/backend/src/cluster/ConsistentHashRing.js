/**
 * SPIT Cache Module — Phase 4: Consistent Hashing Ring
 * Implements 32-bit Murmur-style deterministic hash ring with virtual nodes (vnodes)
 * for uniform distributed key partitioning without full-cluster reshuffling.
 */
import crypto from 'crypto';

export class ConsistentHashRing {
  constructor(virtualNodesPerNode = 128) {
    this.virtualNodesPerNode = virtualNodesPerNode;
    this.ring = new Map(); // hash -> physicalNodeId
    this.sortedKeys = []; // sorted array of hashes for binary search
    this.nodes = new Set();
  }

  hash(key) {
    const hash = crypto.createHash('md5').update(String(key)).digest();
    // Return unsigned 32-bit integer
    return hash.readUInt32BE(0);
  }

  addNode(nodeId) {
    if (this.nodes.has(nodeId)) return;
    this.nodes.add(nodeId);

    for (let i = 0; i < this.virtualNodesPerNode; i++) {
      const vnodeKey = `${nodeId}#vnode-${i}`;
      const vnodeHash = this.hash(vnodeKey);
      this.ring.set(vnodeHash, nodeId);
      this.sortedKeys.push(vnodeHash);
    }

    this.sortedKeys.sort((a, b) => a - b);
  }

  removeNode(nodeId) {
    if (!this.nodes.has(nodeId)) return;
    this.nodes.delete(nodeId);

    for (let i = 0; i < this.virtualNodesPerNode; i++) {
      const vnodeKey = `${nodeId}#vnode-${i}`;
      const vnodeHash = this.hash(vnodeKey);
      this.ring.delete(vnodeHash);
    }

    this.sortedKeys = this.sortedKeys.filter((h) => this.ring.has(h));
  }

  getNode(key) {
    if (this.sortedKeys.length === 0) return null;

    const keyHash = this.hash(key);
    // Binary search for first vnode hash >= keyHash
    let low = 0;
    let high = this.sortedKeys.length - 1;
    let targetIdx = 0;

    if (keyHash > this.sortedKeys[high] || keyHash <= this.sortedKeys[0]) {
      targetIdx = 0; // Wrap around the ring
    } else {
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (this.sortedKeys[mid] >= keyHash) {
          targetIdx = mid;
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }
    }

    const vnodeHash = this.sortedKeys[targetIdx];
    return this.ring.get(vnodeHash);
  }

  getRingTopology() {
    const nodeCounts = {};
    for (const node of this.nodes) {
      nodeCounts[node] = 0;
    }
    for (const [, nodeId] of this.ring.entries()) {
      nodeCounts[nodeId] = (nodeCounts[nodeId] || 0) + 1;
    }

    return {
      totalNodes: this.nodes.size,
      nodes: Array.from(this.nodes),
      virtualNodesPerNode: this.virtualNodesPerNode,
      totalSlots: this.sortedKeys.length,
      distribution: nodeCounts
    };
  }
}
