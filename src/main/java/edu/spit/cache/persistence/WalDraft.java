package edu.spit.cache.persistence;

/** Record intent before the WAL assigns a monotonic sequence number. */
public record WalDraft(
        String transactionId,
        WalOperation operation,
        String key,
        String value,
        long expiresAtEpochMillis) {

    public WalDraft {
        transactionId = transactionId == null || transactionId.isBlank() ? "-" : transactionId;
        if (operation == null) throw new IllegalArgumentException("operation is required");
        key = key == null ? "" : key;
        value = value == null ? "" : value;
    }

    public static WalDraft standalone(WalOperation operation, String key, String value, long expiresAtEpochMillis) {
        return new WalDraft("-", operation, key, value, expiresAtEpochMillis);
    }
}
