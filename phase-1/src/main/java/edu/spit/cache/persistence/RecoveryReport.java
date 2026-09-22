package edu.spit.cache.persistence;

import java.util.List;

/** Details summary of the Write-Ahead Log crash recovery execution. */
public record RecoveryReport(
        int totalWalRecords,
        int recordsApplied,
        int recordsSkippedCorrupted,
        int expiredRecordsPurged,
        long elapsedMs,
        List<String> corruptionDetails
) {
    public String formatSummary() {
        return String.format(
                "Recovery Complete in %d ms | Total Records: %d | Applied: %d | Corrupted/Skipped: %d | Expired Purged: %d",
                elapsedMs, totalWalRecords, recordsApplied, recordsSkippedCorrupted, expiredRecordsPurged
        );
    }
}
