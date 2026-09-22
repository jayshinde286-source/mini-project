# Professional Project Structure

## Dependency direction

The code follows a simple inward dependency rule:

```text
CLI / Main
    ↓
Service facade
    ↓
Core + transaction + persistence
    ↓
API records, events, configuration and index
```

Event subscribers depend on the event contract. The core engine never imports the CLI. Persistence does not print to the console. The B-tree does not know about WAL files. This prevents circular design and makes each component independently testable.

## Package responsibilities

### `api`

Public immutable results returned to callers. `CacheValue` exposes value, version, creation time and expiry. `CompareAndSetResult` explains success or mismatch without throwing for a normal concurrency race.

### `config`

Validated runtime choices. Configuration is immutable after startup so behavior cannot change halfway through a durability operation.

### `core`

Owns the primary map, B-tree coordination, entry metadata, TTL removal and invariant validation. It does not perform file I/O or console I/O.

### `event`

Defines immutable events and ordered delivery. Subscribers include the bounded in-memory journal and JSON Lines audit writer. Listener failures are counted and isolated.

### `metrics`

Implements a projection: it derives counters only from published facts. The service does not manually maintain a second set of metric counters.

### `persistence`

Owns serialized durable formats. The V2 WAL uses Base64 fields, sequence numbers, per-record CRC32 and exclusive OS lock ownership. `TransactionBatchIntegrity` adds count-plus-SHA-256 commit manifests so a partially readable transaction cannot be replayed. Snapshot files use a header, entry count, checksums, fsync and atomic replacement.

### `transaction`

Owns transaction lifecycle, buffered operations, deadlines and per-key owners. Commit writes the complete operation batch and commit marker before memory publication.

### `index`

Contains the reusable generic B-tree. It has no dependency on cache-specific services.

### `eviction`

Contains bounded LRU and LFU implementations used to study policy behavior independently from crash recovery.

### `service`

The public facade and composition root. It is the only place that coordinates WAL, engine, events, snapshots and scheduled maintenance. `DiagnosticsReport` assembles a read-only evidence view without moving persistence or metric logic into the CLI.

### `cli`

Translates human commands into service calls. It owns parsing and formatting, but no durability logic.

### `benchmark`

Generates deterministic workload distributions and reports cache-policy measurements.

## Coding conventions

- Java 17 records are used for immutable data carriers.
- State-owning classes are `final` unless extension is a deliberate contract.
- Public methods validate keys, TTL values and configuration.
- File formats are versioned and checksummed.
- Locks are private and acquired in a consistent order.
- I/O exceptions are propagated to the facade or CLI instead of silently ignored.
- Event subscriber failures are isolated because observers must not break the primary mutation.
- Tests use independent temporary directories; they never depend on developer data.
- Build outputs stay under `target/`; runtime state stays under `data/`.
