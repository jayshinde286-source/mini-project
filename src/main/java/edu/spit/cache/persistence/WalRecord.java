package edu.spit.cache.persistence;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/** Version 2 WAL record with a CRC32 checksum and Base64-safe payload fields. */
public record WalRecord(
        long sequence,
        long timestampEpochMillis,
        String transactionId,
        WalOperation operation,
        String key,
        String value,
        long expiresAtEpochMillis) {

    private static final String FORMAT = "V2";

    public String serialize() {
        String payload = String.join("\t",
                FORMAT,
                Long.toString(sequence),
                Long.toString(timestampEpochMillis),
                transactionId,
                operation.name(),
                Long.toString(expiresAtEpochMillis),
                encode(key),
                encode(value));
        return payload + "\t" + ChecksumUtil.crc32Hex(payload);
    }

    public static WalRecord parseV2(String line) {
        String[] parts = line.split("\t", -1);
        if (parts.length != 9 || !FORMAT.equals(parts[0])) throw new IllegalArgumentException("malformed V2 WAL record");
        String payload = String.join("\t", java.util.Arrays.copyOf(parts, 8));
        if (!ChecksumUtil.crc32Hex(payload).equalsIgnoreCase(parts[8])) {
            throw new IllegalStateException("WAL checksum mismatch");
        }
        return new WalRecord(
                Long.parseLong(parts[1]),
                Long.parseLong(parts[2]),
                parts[3],
                WalOperation.valueOf(parts[4]),
                decode(parts[6]),
                decode(parts[7]),
                Long.parseLong(parts[5]));
    }

    /** Reads the original five-column format so older demo data is still recoverable. */
    public static WalRecord parseLegacy(String line, long assignedSequence) {
        String[] parts = line.split("\t", -1);
        if (parts.length != 5) throw new IllegalArgumentException("malformed legacy WAL record");
        return new WalRecord(
                assignedSequence,
                Long.parseLong(parts[0]),
                parts[1],
                WalOperation.valueOf(parts[2]),
                decode(parts[3]),
                decode(parts[4]),
                0);
    }

    private static String encode(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String decode(String value) {
        return new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8);
    }
}
