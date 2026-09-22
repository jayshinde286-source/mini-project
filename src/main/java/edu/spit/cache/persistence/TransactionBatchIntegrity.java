package edu.spit.cache.persistence;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;

/**
 * Creates and validates a commit manifest for all data records in a transaction.
 * Record CRCs detect local damage; this batch digest prevents a partially readable
 * transaction from being replayed as though it were complete.
 */
public final class TransactionBatchIntegrity {
    private static final String VERSION = "TXI1";

    private TransactionBatchIntegrity() { }

    public static String manifestForDrafts(List<WalDraft> drafts) {
        MessageDigest digest = sha256();
        drafts.forEach(draft -> update(
                digest,
                draft.operation(),
                draft.key(),
                draft.value(),
                draft.expiresAtEpochMillis()));
        return VERSION + ":" + drafts.size() + ":" + HexFormat.of().formatHex(digest.digest());
    }

    /** Empty metadata denotes a legacy transaction written before manifests existed. */
    public static Validation validate(List<WalRecord> operations, String manifest) {
        if (manifest == null || manifest.isBlank()) return Validation.LEGACY_UNVERIFIED;
        String[] parts = manifest.split(":", -1);
        if (parts.length != 3 || !VERSION.equals(parts[0])) return Validation.INVALID;
        final int expectedCount;
        try {
            expectedCount = Integer.parseInt(parts[1]);
        } catch (NumberFormatException invalidCount) {
            return Validation.INVALID;
        }
        if (expectedCount != operations.size()) return Validation.INVALID;
        MessageDigest digest = sha256();
        operations.forEach(record -> update(
                digest,
                record.operation(),
                record.key(),
                record.value(),
                record.expiresAtEpochMillis()));
        byte[] expected;
        try {
            expected = HexFormat.of().parseHex(parts[2]);
        } catch (IllegalArgumentException invalidHex) {
            return Validation.INVALID;
        }
        return MessageDigest.isEqual(expected, digest.digest()) ? Validation.VERIFIED : Validation.INVALID;
    }

    private static void update(
            MessageDigest digest,
            WalOperation operation,
            String key,
            String value,
            long expiresAtEpochMillis) {
        updateField(digest, operation.name());
        updateField(digest, key);
        updateField(digest, value);
        digest.update(ByteBuffer.allocate(Long.BYTES).putLong(expiresAtEpochMillis).array());
    }

    private static void updateField(MessageDigest digest, String value) {
        byte[] bytes = value.getBytes(StandardCharsets.UTF_8);
        digest.update(ByteBuffer.allocate(Integer.BYTES).putInt(bytes.length).array());
        digest.update(bytes);
    }

    private static MessageDigest sha256() {
        try {
            return MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException impossibleOnJava17) {
            throw new IllegalStateException("SHA-256 is unavailable", impossibleOnJava17);
        }
    }

    public enum Validation { VERIFIED, LEGACY_UNVERIFIED, INVALID }
}
