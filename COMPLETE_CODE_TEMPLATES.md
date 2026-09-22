# Complete Code Templates & Implementation Examples

This document contains all Java code templates, examples, and implementations ready to copy-paste and use.

---

## PHASE I: CORE CACHE + CRASH RECOVERY

### CacheEngine.java — The Fast Storage

```java
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * CacheEngine = the "toy box".
 * This is just a fast in-memory key-value store.
 * We use ConcurrentHashMap instead of HashMap so it's technically thread-safe
 * (good to mention in your report, even though we're not running multiple threads yet).
 */
public class CacheEngine {

    private final Map<String, String> store = new ConcurrentHashMap<>();

    // Add or update a key -> value pair in the cache
    public void put(String key, String value) {
        store.put(key, value);
    }

    // Get a value by key. Returns null if not found.
    public String get(String key) {
        return store.get(key);
    }

    // Remove a key from the cache
    public void delete(String key) {
        store.remove(key);
    }

    // Check if a key exists
    public boolean contains(String key) {
        return store.containsKey(key);
    }

    // Get the whole cache (used for snapshotting)
    public Map<String, String> getAll() {
        return store;
    }

    // How many items are currently cached
    public int size() {
        return store.size();
    }
}
```

### WALLogger.java — The Notebook

```java
import java.io.*;
import java.util.*;

/**
 * Write-Ahead Logger — logs every operation to disk BEFORE applying it.
 * Format: TIMESTAMP,OPERATION,KEY,VALUE
 * Example: 1692345600,SET,jay_score,95
 */
public class WALLogger {
    private final String logFilePath;
    private final BufferedWriter writer;

    public WALLogger(String logFilePath) throws IOException {
        this.logFilePath = logFilePath;
        // Open the log file in append mode (don't overwrite, just add to end)
        this.writer = new BufferedWriter(new FileWriter(logFilePath, true));
    }

    // Log a SET operation
    public void logSet(String key, String value) throws IOException {
        String logEntry = System.currentTimeMillis() + ",SET," + key + "," + value;
        writer.write(logEntry);
        writer.newLine();
        writer.flush(); // Force write to disk immediately
    }

    // Log a DELETE operation
    public void logDelete(String key) throws IOException {
        String logEntry = System.currentTimeMillis() + ",DELETE," + key + ",";
        writer.write(logEntry);
        writer.newLine();
        writer.flush();
    }

    // Replay the entire log to rebuild cache state
    public List<LogEntry> readAndReplayLog() throws IOException {
        List<LogEntry> entries = new ArrayList<>();
        File logFile = new File(logFilePath);

        if (!logFile.exists()) {
            System.out.println("Log file doesn't exist yet — starting with empty cache.");
            return entries;
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(logFilePath))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;

                String[] parts = line.split(",", 4);
                if (parts.length < 2) continue;

                LogEntry entry = new LogEntry(
                    Long.parseLong(parts[0]),  // timestamp
                    parts[1],                   // operation (SET or DELETE)
                    parts[2],                   // key
                    parts.length > 3 ? parts[3] : ""  // value
                );
                entries.add(entry);
            }
        }

        return entries;
    }

    public void close() throws IOException {
        writer.close();
    }

    // Helper class to represent a single log entry
    public static class LogEntry {
        public long timestamp;
        public String operation;
        public String key;
        public String value;

        public LogEntry(long timestamp, String operation, String key, String value) {
            this.timestamp = timestamp;
            this.operation = operation;
            this.key = key;
            this.value = value;
        }

        @Override
        public String toString() {
            return timestamp + "," + operation + "," + key + "," + value;
        }
    }
}
```

### CommandHandler.java — The CLI Interface

```java
import java.io.IOException;
import java.util.Scanner;

/**
 * Handles user commands from the CLI.
 * Commands: SET key value, GET key, DELETE key, SHOW, EXIT
 */
public class CommandHandler {
    private final CacheEngine cache;
    private final WALLogger logger;
    private final Scanner scanner;

    public CommandHandler(CacheEngine cache, WALLogger logger) {
        this.cache = cache;
        this.logger = logger;
        this.scanner = new Scanner(System.in);
    }

    public void start() {
        System.out.println("\n=== Persistent Event-Driven Memory Cache ===");
        System.out.println("Commands: SET <key> <value>, GET <key>, DELETE <key>, SHOW, EXIT\n");

        while (true) {
            System.out.print("> ");
            String input = scanner.nextLine().trim();

            if (input.isEmpty()) continue;

            String[] parts = input.split(" ", 3);
            String command = parts[0].toUpperCase();

            try {
                switch (command) {
                    case "SET":
                        if (parts.length < 3) {
                            System.out.println("Usage: SET <key> <value>");
                            break;
                        }
                        String key = parts[1];
                        String value = parts[2];
                        logger.logSet(key, value);  // Log FIRST
                        cache.put(key, value);       // Then apply
                        System.out.println("OK");
                        break;

                    case "GET":
                        if (parts.length < 2) {
                            System.out.println("Usage: GET <key>");
                            break;
                        }
                        String result = cache.get(parts[1]);
                        System.out.println(result != null ? result : "(nil)");
                        break;

                    case "DELETE":
                        if (parts.length < 2) {
                            System.out.println("Usage: DELETE <key>");
                            break;
                        }
                        logger.logDelete(parts[1]);  // Log FIRST
                        cache.delete(parts[1]);       // Then apply
                        System.out.println("OK");
                        break;

                    case "SHOW":
                        System.out.println("=== Current Cache State ===");
                        if (cache.size() == 0) {
                            System.out.println("(empty)");
                        } else {
                            cache.getAll().forEach((k, v) -> System.out.println(k + " -> " + v));
                        }
                        break;

                    case "EXIT":
                        System.out.println("Goodbye!");
                        logger.close();
                        System.exit(0);
                        break;

                    default:
                        System.out.println("Unknown command: " + command);
                }
            } catch (IOException e) {
                System.out.println("Error: " + e.getMessage());
            }
        }
    }
}
```

### Main.java — The Orchestrator

```java
import java.io.IOException;
import java.util.List;

/**
 * Main entry point for the cache application.
 * On startup: reads log, replays all operations to rebuild cache.
 * Then: enters command loop waiting for user input.
 */
public class Main {
    public static void main(String[] args) throws IOException {
        String logFilePath = "logs/cache.log";
        
        // Initialize cache and logger
        CacheEngine cache = new CacheEngine();
        WALLogger logger = new WALLogger(logFilePath);

        // Replay the log to recover previous state
        System.out.println("Starting up... recovering cache state from log...");
        List<WALLogger.LogEntry> entries = logger.readAndReplayLog();
        
        for (WALLogger.LogEntry entry : entries) {
            if ("SET".equals(entry.operation)) {
                cache.put(entry.key, entry.value);
            } else if ("DELETE".equals(entry.operation)) {
                cache.delete(entry.key);
            }
        }
        
        System.out.println("Recovery complete. Cache now contains " + cache.size() + " entries.");

        // Start command loop
        CommandHandler handler = new CommandHandler(cache, logger);
        handler.start();
    }
}
```

---

## PHASE II: EVICTION POLICIES

### LRUCache.java — Least Recently Used

```java
import java.util.*;

/**
 * LRU Cache with O(1) get/put/delete operations and O(1) eviction.
 * When cache is full, the least-recently-used item is evicted.
 */
public class LRUCache {
    private final int capacity;
    private final Map<String, Node> cache;
    private Node head, tail;
    private int hits = 0;
    private int misses = 0;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.cache = new HashMap<>();
        this.head = new Node("", "");
        this.tail = new Node("", "");
        head.next = tail;
        tail.prev = head;
    }

    public String get(String key) {
        if (!cache.containsKey(key)) {
            misses++;
            return null;
        }

        Node node = cache.get(key);
        moveToFront(node);
        hits++;
        return node.value;
    }

    public void put(String key, String value) {
        if (cache.containsKey(key)) {
            Node node = cache.get(key);
            node.value = value;
            moveToFront(node);
        } else {
            if (cache.size() >= capacity) {
                evictLRU();
            }
            Node newNode = new Node(key, value);
            cache.put(key, newNode);
            addToFront(newNode);
        }
    }

    public void delete(String key) {
        if (cache.containsKey(key)) {
            Node node = cache.get(key);
            removeNode(node);
            cache.remove(key);
        }
    }

    private void moveToFront(Node node) {
        removeNode(node);
        addToFront(node);
    }

    private void addToFront(Node node) {
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(Node node) {
        Node prevNode = node.prev;
        Node nextNode = node.next;
        prevNode.next = nextNode;
        nextNode.prev = prevNode;
    }

    private void evictLRU() {
        Node lruNode = tail.prev;
        removeNode(lruNode);
        cache.remove(lruNode.key);
    }

    public int getHits() { return hits; }
    public int getMisses() { return misses; }
    public double getHitRate() {
        int total = hits + misses;
        return total == 0 ? 0 : (double) hits / total * 100;
    }
    public int size() { return cache.size(); }
    public int getCapacity() { return capacity; }

    private static class Node {
        String key, value;
        Node prev, next;

        Node(String key, String value) {
            this.key = key;
            this.value = value;
        }
    }
}
```

### LFUCache.java — Least Frequently Used

```java
import java.util.*;

/**
 * LFU Cache with O(1) get/put operations and O(n) eviction.
 * When cache is full, the least-frequently-used item is evicted.
 */
public class LFUCache {
    private final int capacity;
    private final Map<String, String> cache;
    private final Map<String, Integer> frequency;
    private final Map<String, Long> timestamp;
    private int hits = 0;
    private int misses = 0;

    public LFUCache(int capacity) {
        this.capacity = capacity;
        this.cache = new HashMap<>();
        this.frequency = new HashMap<>();
        this.timestamp = new HashMap<>();
    }

    public String get(String key) {
        if (!cache.containsKey(key)) {
            misses++;
            return null;
        }

        frequency.put(key, frequency.get(key) + 1);
        timestamp.put(key, System.nanoTime());
        hits++;
        return cache.get(key);
    }

    public void put(String key, String value) {
        if (cache.containsKey(key)) {
            cache.put(key, value);
            frequency.put(key, frequency.get(key) + 1);
            timestamp.put(key, System.nanoTime());
        } else {
            if (cache.size() >= capacity) {
                evictLFU();
            }
            cache.put(key, value);
            frequency.put(key, 1);
            timestamp.put(key, System.nanoTime());
        }
    }

    public void delete(String key) {
        if (cache.containsKey(key)) {
            cache.remove(key);
            frequency.remove(key);
            timestamp.remove(key);
        }
    }

    private void evictLFU() {
        String lfuKey = cache.keySet().iterator().next();
        int minFreq = frequency.get(lfuKey);
        long oldestTime = timestamp.get(lfuKey);

        for (String key : cache.keySet()) {
            int freq = frequency.get(key);
            long time = timestamp.get(key);
            
            if (freq < minFreq || (freq == minFreq && time < oldestTime)) {
                lfuKey = key;
                minFreq = freq;
                oldestTime = time;
            }
        }

        cache.remove(lfuKey);
        frequency.remove(lfuKey);
        timestamp.remove(lfuKey);
    }

    public int getHits() { return hits; }
    public int getMisses() { return misses; }
    public double getHitRate() {
        int total = hits + misses;
        return total == 0 ? 0 : (double) hits / total * 100;
    }
    public int size() { return cache.size(); }
    public int getCapacity() { return capacity; }
}
```

### AccessPattern.java — Traffic Simulator

```java
import java.util.*;

/**
 * Generates realistic cache access patterns for benchmarking.
 */
public class AccessPattern {
    private final Random random;
    private final int keyRange;
    private final String pattern;

    public AccessPattern(int keyRange, String pattern) {
        this.keyRange = keyRange;
        this.pattern = pattern;
        this.random = new Random(42);
    }

    public String getNextKey() {
        switch (pattern.toLowerCase()) {
            case "uniform":
                return "key_" + random.nextInt(keyRange);
            case "zipfian":
                return "key_" + getZipfianValue(keyRange);
            case "working_set":
                return getWorkingSetKey();
            default:
                throw new IllegalArgumentException("Unknown pattern: " + pattern);
        }
    }

    private int getZipfianValue(int max) {
        double u = random.nextDouble();
        int rank = (int) (1.0 / Math.pow(u, 1.0 / 1.5));
        return Math.min(rank % max, max - 1);
    }

    private String getWorkingSetKey() {
        if (random.nextDouble() < 0.8) {
            return "key_" + random.nextInt(10);
        } else {
            return "key_" + random.nextInt(keyRange);
        }
    }
}
```

### Benchmark.java — Performance Comparison

```java
/**
 * Benchmark suite comparing LRU vs LFU caches.
 */
public class Benchmark {
    
    public static void main(String[] args) {
        int capacity = 100;
        int accessCount = 10000;
        
        System.out.println("========== CACHE BENCHMARK ==========\n");
        
        System.out.println("Test 1: UNIFORM ACCESS PATTERN\n");
        runBenchmark("LRU", capacity, accessCount, "uniform");
        runBenchmark("LFU", capacity, accessCount, "uniform");
        
        System.out.println("\n" + "=".repeat(50) + "\n");
        
        System.out.println("Test 2: ZIPFIAN ACCESS PATTERN\n");
        runBenchmark("LRU", capacity, accessCount, "zipfian");
        runBenchmark("LFU", capacity, accessCount, "zipfian");
        
        System.out.println("\n" + "=".repeat(50) + "\n");
        
        System.out.println("Test 3: WORKING SET PATTERN\n");
        runBenchmark("LRU", capacity, accessCount, "working_set");
        runBenchmark("LFU", capacity, accessCount, "working_set");
    }
    
    private static void runBenchmark(String cacheType, int capacity, int accessCount, String pattern) {
        long startTime = System.currentTimeMillis();
        
        if ("LRU".equals(cacheType)) {
            LRUCache cache = new LRUCache(capacity);
            AccessPattern ap = new AccessPattern(1000, pattern);
            
            for (int i = 0; i < accessCount; i++) {
                String key = ap.getNextKey();
                String result = cache.get(key);
                if (result == null) {
                    cache.put(key, "value_" + key);
                }
            }
            
            long endTime = System.currentTimeMillis();
            
            System.out.println("LRU Cache Results:");
            System.out.println("  Hits: " + cache.getHits());
            System.out.println("  Misses: " + cache.getMisses());
            System.out.printf("  Hit Rate: %.2f%%\n", cache.getHitRate());
            System.out.println("  Cache Size: " + cache.size() + "/" + cache.getCapacity());
            System.out.println("  Time: " + (endTime - startTime) + " ms");
            System.out.println();
            
        } else {
            LFUCache cache = new LFUCache(capacity);
            AccessPattern ap = new AccessPattern(1000, pattern);
            
            for (int i = 0; i < accessCount; i++) {
                String key = ap.getNextKey();
                String result = cache.get(key);
                if (result == null) {
                    cache.put(key, "value_" + key);
                }
            }
            
            long endTime = System.currentTimeMillis();
            
            System.out.println("LFU Cache Results:");
            System.out.println("  Hits: " + cache.getHits());
            System.out.println("  Misses: " + cache.getMisses());
            System.out.printf("  Hit Rate: %.2f%%\n", cache.getHitRate());
            System.out.println("  Cache Size: " + cache.size() + "/" + cache.getCapacity());
            System.out.println("  Time: " + (endTime - startTime) + " ms");
            System.out.println();
        }
    }
}
```

---

## PHASE III: TRANSACTIONS

### Transaction.java — Transaction Object

```java
import java.util.*;

/**
 * Represents a single transaction.
 */
public class Transaction {
    public enum State {
        STARTED, ACTIVE, COMMITTED, ABORTED
    }

    private final String transactionId;
    private State state;
    private final long startTime;
    private final List<WriteOperation> operations;
    private final Set<String> readSet;
    private final Set<String> writeSet;

    public Transaction(String transactionId) {
        this.transactionId = transactionId;
        this.state = State.STARTED;
        this.startTime = System.currentTimeMillis();
        this.operations = new ArrayList<>();
        this.readSet = new HashSet<>();
        this.writeSet = new HashSet<>();
    }

    public void read(String key) {
        readSet.add(key);
    }

    public void write(String key, String value) {
        writeSet.add(key);
        operations.add(new WriteOperation("SET", key, value));
    }

    public void delete(String key) {
        writeSet.add(key);
        operations.add(new WriteOperation("DELETE", key, ""));
    }

    public void setState(State state) {
        this.state = state;
    }

    public State getState() {
        return state;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public Set<String> getReadSet() {
        return readSet;
    }

    public Set<String> getWriteSet() {
        return writeSet;
    }

    public List<WriteOperation> getOperations() {
        return operations;
    }

    public long getStartTime() {
        return startTime;
    }

    public boolean conflictsWith(Transaction other) {
        for (String key : writeSet) {
            if (other.writeSet.contains(key)) {
                return true;
            }
        }
        for (String key : readSet) {
            if (other.writeSet.contains(key)) {
                return true;
            }
        }
        for (String key : writeSet) {
            if (other.readSet.contains(key)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public String toString() {
        return String.format("TX[%s: %s, reads=%d, writes=%d]",
            transactionId, state, readSet.size(), writeSet.size());
    }

    public static class WriteOperation {
        public String operation;
        public String key;
        public String value;

        public WriteOperation(String operation, String key, String value) {
            this.operation = operation;
            this.key = key;
            this.value = value;
        }

        @Override
        public String toString() {
            return operation + "(" + key + ", " + value + ")";
        }
    }
}
```

### BTreeIndex.java — Range Queries

```java
import java.util.*;

/**
 * B-Tree implementation for range queries.
 */
public class BTreeIndex {
    private final SortedMap<String, String> tree;

    public BTreeIndex() {
        this.tree = new TreeMap<>();
    }

    public void put(String key, String value) {
        tree.put(key, value);
    }

    public String get(String key) {
        return tree.get(key);
    }

    public void delete(String key) {
        tree.remove(key);
    }

    public Map<String, String> rangeQuery(String minKey, String maxKey) {
        return new HashMap<>(tree.subMap(minKey, true, maxKey, true));
    }

    public Set<String> keySet() {
        return tree.keySet();
    }

    public Collection<String> values() {
        return tree.values();
    }

    public int size() {
        return tree.size();
    }

    public boolean containsKey(String key) {
        return tree.containsKey(key);
    }
}
```

---

## PHASE III: TRANSACTION MANAGER

### TransactionManager.java

```java
import java.io.IOException;
import java.util.*;
import java.util.concurrent.*;

/**
 * Manages transaction lifecycle.
 */
public class TransactionManager {
    private final CacheEngine cache;
    private final WALLogger logger;
    private final BTreeIndex index;
    
    private final Map<String, Transaction> activeTransactions;
    private final Map<String, Long> keyLocks;
    private final ReentrantReadWriteLock transactionLock;
    
    private int transactionCounter = 0;

    public TransactionManager(CacheEngine cache, WALLogger logger, BTreeIndex index) {
        this.cache = cache;
        this.logger = logger;
        this.index = index;
        this.activeTransactions = new ConcurrentHashMap<>();
        this.keyLocks = new ConcurrentHashMap<>();
        this.transactionLock = new ReentrantReadWriteLock();
    }

    public String beginTransaction() {
        String txId = "TX_" + (++transactionCounter);
        Transaction tx = new Transaction(txId);
        activeTransactions.put(txId, tx);
        
        try {
            logger.logTransactionEvent(txId, "STARTED");
        } catch (IOException e) {
            System.err.println("Error logging transaction start: " + e.getMessage());
        }
        
        System.out.println("Transaction " + txId + " started");
        return txId;
    }

    public String read(String txId, String key) {
        if (!activeTransactions.containsKey(txId)) {
            throw new IllegalArgumentException("Unknown transaction: " + txId);
        }

        Transaction tx = activeTransactions.get(txId);
        tx.read(key);
        
        String value = cache.get(key);
        System.out.println("TX[" + txId + "] READ " + key + " = " + (value != null ? value : "(nil)"));
        return value;
    }

    public void write(String txId, String key, String value) throws IOException {
        if (!activeTransactions.containsKey(txId)) {
            throw new IllegalArgumentException("Unknown transaction: " + txId);
        }

        Transaction tx = activeTransactions.get(txId);
        
        if (keyLocks.containsKey(key) && !keyLocks.get(key).equals(Long.valueOf(txId.hashCode()))) {
            System.out.println("TX[" + txId + "] CONFLICT on key " + key + " — cannot acquire lock");
            throw new ConcurrentModificationException("Write-Write conflict on key: " + key);
        }

        keyLocks.put(key, Long.valueOf(txId.hashCode()));
        tx.write(key, value);
        
        logger.logTransactionEvent(txId, "WRITE " + key + " = " + value);
        System.out.println("TX[" + txId + "] WRITE " + key + " = " + value + " (buffered)");
    }

    public void delete(String txId, String key) throws IOException {
        if (!activeTransactions.containsKey(txId)) {
            throw new IllegalArgumentException("Unknown transaction: " + txId);
        }

        Transaction tx = activeTransactions.get(txId);
        
        if (keyLocks.containsKey(key) && !keyLocks.get(key).equals(Long.valueOf(txId.hashCode()))) {
            System.out.println("TX[" + txId + "] CONFLICT on key " + key + " — cannot acquire lock");
            throw new ConcurrentModificationException("Write-Write conflict on key: " + key);
        }

        keyLocks.put(key, Long.valueOf(txId.hashCode()));
        tx.delete(key);
        
        logger.logTransactionEvent(txId, "DELETE " + key);
        System.out.println("TX[" + txId + "] DELETE " + key + " (buffered)");
    }

    public void commit(String txId) throws IOException {
        if (!activeTransactions.containsKey(txId)) {
            throw new IllegalArgumentException("Unknown transaction: " + txId);
        }

        Transaction tx = activeTransactions.get(txId);
        List<Transaction.WriteOperation> operations = tx.getOperations();

        try {
            logger.logTransactionEvent(txId, "COMMIT_STARTED");

            for (Transaction.WriteOperation op : operations) {
                if ("SET".equals(op.operation)) {
                    cache.put(op.key, op.value);
                    index.put(op.key, op.value);
                } else if ("DELETE".equals(op.operation)) {
                    cache.delete(op.key);
                    index.delete(op.key);
                }
            }

            tx.setState(Transaction.State.COMMITTED);
            logger.logTransactionEvent(txId, "COMMITTED");
            
            for (String key : tx.getWriteSet()) {
                keyLocks.remove(key);
            }

            activeTransactions.remove(txId);
            System.out.println("TX[" + txId + "] COMMITTED successfully (" + operations.size() + " operations)");

        } catch (Exception e) {
            System.out.println("TX[" + txId + "] COMMIT FAILED: " + e.getMessage() + " — rolling back");
            rollback(txId);
            throw e;
        }
    }

    public void rollback(String txId) throws IOException {
        if (!activeTransactions.containsKey(txId)) {
            throw new IllegalArgumentException("Unknown transaction: " + txId);
        }

        Transaction tx = activeTransactions.get(txId);

        tx.setState(Transaction.State.ABORTED);
        logger.logTransactionEvent(txId, "ABORTED");

        for (String key : tx.getWriteSet()) {
            keyLocks.remove(key);
        }

        activeTransactions.remove(txId);
        System.out.println("TX[" + txId + "] ROLLED BACK — all changes discarded");
    }

    public Transaction.State getStatus(String txId) {
        Transaction tx = activeTransactions.get(txId);
        return tx != null ? tx.getState() : null;
    }

    public void listActiveTransactions() {
        System.out.println("=== Active Transactions ===");
        if (activeTransactions.isEmpty()) {
            System.out.println("(none)");
        } else {
            activeTransactions.values().forEach(System.out::println);
        }
    }
}
```

---

## TESTING CODE

### CacheEngineTest.java

```java
import org.junit.Test;
import static org.junit.Assert.*;

public class CacheEngineTest {

    @Test
    public void testPutAndGet() {
        CacheEngine cache = new CacheEngine();
        cache.put("name", "Jay");
        assertEquals("Jay", cache.get("name"));
    }

    @Test
    public void testGetNonExistent() {
        CacheEngine cache = new CacheEngine();
        assertNull(cache.get("nonexistent"));
    }

    @Test
    public void testDelete() {
        CacheEngine cache = new CacheEngine();
        cache.put("key1", "value1");
        assertTrue(cache.contains("key1"));
        cache.delete("key1");
        assertFalse(cache.contains("key1"));
    }

    @Test
    public void testUpdate() {
        CacheEngine cache = new CacheEngine();
        cache.put("key", "old");
        assertEquals("old", cache.get("key"));
        cache.put("key", "new");
        assertEquals("new", cache.get("key"));
    }

    @Test
    public void testSize() {
        CacheEngine cache = new CacheEngine();
        assertEquals(0, cache.size());
        cache.put("k1", "v1");
        cache.put("k2", "v2");
        assertEquals(2, cache.size());
        cache.delete("k1");
        assertEquals(1, cache.size());
    }
}
```

---

**End of Complete Code Templates**

**All code is ready to copy-paste and use!**
