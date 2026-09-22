package edu.spit.cache.persistence;

import java.util.List;

/** Container for WAL file read results, tracking valid records and encountered errors. */
public record WalReadResult(
        List<WalRecord> records,
        int validCount,
        int corruptedCount,
        List<String> errors
) {}
