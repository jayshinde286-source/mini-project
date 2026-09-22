package edu.spit.cache.persistence;

import java.util.List;

/** WAL scan result keeps corruption visible instead of silently hiding it. */
public record WalReadResult(List<WalRecord> records, int malformedRecords, int checksumFailures) {
    public WalReadResult {
        records = List.copyOf(records);
    }
}
