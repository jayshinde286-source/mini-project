package edu.spit.cache.persistence;

/** Detailed startup evidence surfaced to the CLI and viva demonstration. */
public record RecoveryReport(
        int snapshotEntriesRestored,
        int walOperationsApplied,
        int incompleteTransactionOperationsSkipped,
        int rejectedTransactionBatches,
        int legacyTransactionBatchesAccepted,
        int expiredEntriesSkipped,
        int malformedWalRecords,
        int checksumFailures,
        long snapshotSequence,
        long finalWalSequence) {

    public int totalEntriesMaterialized() { return snapshotEntriesRestored + walOperationsApplied; }
}
