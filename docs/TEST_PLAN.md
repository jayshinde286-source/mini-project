# Test Plan and Evidence Matrix

## Test strategy

The suite combines component tests with restart-level integration tests. Every persistence test uses an isolated temporary directory. Tests run without external dependencies through `make test`.

| # | Test | Risk controlled | Expected evidence |
|---:|---|---|---|
| 1 | Invalid configuration | unsafe runtime values | constructor rejects invalid capacity/timeouts |
| 2 | Engine invariant | map/index divergence | `healthy=true` after update/delete |
| 3 | Stale replay | older WAL overwrites newer state | stale put/delete are not applied |
| 4 | B-tree operations | split/range/update/delete errors | 300-key insertion and exact inclusive range |
| 5 | LRU | wrong recency victim | least-recent key disappears |
| 6 | LFU | wrong frequency victim | least-frequent key disappears |
| 7 | WAL encoding/checksum | delimiter/Unicode corruption | Unicode round-trip and checksum counter |
| 8 | Snapshot | metadata loss | version/timestamps/sequence round-trip |
| 9 | Event bus | reordering or observer failure | ordered IDs and healthy subscriber delivery |
| 10 | Standalone recovery | acknowledged write loss | value survives complete restart |
| 11 | Incomplete transaction | partial state after crash | staged value is absent after restart |
| 12 | Committed transaction | atomicity/durability failure | both account values recover |
| 13 | Damaged transaction manifest | partial committed replay | entire two-key batch rejected and reported |
| 14 | Exclusive WAL ownership | two processes corrupt shared log | second writer fails before opening WAL |
| 15 | Compare-and-set | lost update | stale version rejected, current version succeeds |
| 16 | TTL | expired data resurrection | absent before and after restart |
| 17 | Metrics projection | observability drift | event-derived counters match operations |
| 18 | Key conflict | two transaction writers | second owner receives conflict |
| 19 | Transaction timeout | leaked lock | timed-out owner removed, new transaction commits |
| 20 | Checkpoint/compaction | state or version reset | snapshot restores and later version increases |
| 21 | CLI + diagnostics flow | demo/API mismatch or weak evidence | value, health, storage and event evidence visible |
| 22 | Concurrent writes | lock/index corruption | 100 keys and healthy invariant |

## Acceptance commands

```bash
make clean
make verify
make demo
make benchmark
```

## Manual crash drill

1. Run `make run`.
2. Store two keys and note their versions.
3. Forcefully terminate the process after the CLI reports success.
4. Run `make run` again.
5. Execute `RECOVERY`, `SHOW`, `HEALTH`, `EVENTS`, and `DIAGNOSTICS`.
6. Confirm values are present, health is good, and the report contains no checksum failure.

## Corruption drill

The automated WAL unit test appends a standalone record with an invalid checksum. A second failure-injection test corrupts one operation in a committed two-key transaction. Recovery sees the valid commit but fails its operation-count/SHA-256 manifest, rejects the full transaction, and increments both checksum and rejected-batch counters. This distinguishes record integrity from transaction atomicity without damaging real `data/` files.
