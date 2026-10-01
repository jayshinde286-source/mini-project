/**
 * DoublyLinkedList
 * Provides strict O(1) insertion, removal, and repositioning operations
 * using dummy HEAD and TAIL sentinel nodes.
 */
import { CacheNode } from './CacheNode.js';

export class DoublyLinkedList {
  constructor() {
    this.head = new CacheNode('__SENTINEL_HEAD__', null, 0);
    this.tail = new CacheNode('__SENTINEL_TAIL__', null, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.size = 0;
  }

  /**
   * Adds node immediately after HEAD (Most Recently Used position).
   * Time Complexity: O(1)
   */
  addToHead(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
    this.size++;
  }

  /**
   * Unlinks an existing node from the list.
   * Time Complexity: O(1)
   */
  removeNode(node) {
    if (!node || node === this.head || node === this.tail) return;
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    node.prev = null;
    node.next = null;
    this.size--;
  }

  /**
   * Repositions an existing node to the HEAD (MRU).
   * Time Complexity: O(1)
   */
  moveToHead(node) {
    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * Removes and returns the victim node immediately preceding the TAIL (LRU).
   * Time Complexity: O(1)
   */
  removeTail() {
    if (this.head.next === this.tail) {
      return null; // Empty list
    }
    const victim = this.tail.prev;
    this.removeNode(victim);
    return victim;
  }

  /**
   * Clears the list.
   */
  clear() {
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.size = 0;
  }

  /**
   * Iterates from MRU to LRU.
   */
  toArray() {
    const list = [];
    let curr = this.head.next;
    while (curr !== this.tail) {
      list.push(curr);
      curr = curr.next;
    }
    return list;
  }
}
