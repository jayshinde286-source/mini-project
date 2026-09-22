package edu.spit.cache.persistence;

/** Monotonic sequence-numbered, checksummed WAL record representation. */
public record WalRecord(
        long sequence,
        long timestamp,
        WalOperation operation,
        String key,
        String value,
        long expiresAtEpochMillis,
        long checksum
) {
    public static WalRecord create(long sequence, WalOperation op, String key, String val, long expiresAt) {
        long ts = System.currentTimeMillis();
        String payload = sequence + "|" + ts + "|" + op + "|" + (key != null ? key : "") + "|" + (val != null ? val : "") + "|" + expiresAt;
        long crc = ChecksumUtil.calculateCrc32(payload);
        return new WalRecord(sequence, ts, op, key, val, expiresAt, crc);
    }

    public String serialize() {
        return sequence + "|" + timestamp + "|" + operation + "|" + (key != null ? key : "") + "|" + (value != null ? value : "") + "|" + expiresAtEpochMillis + "|" + checksum;
    }

    public boolean isValidChecksum() {
        String payload = sequence + "|" + timestamp + "|" + operation + "|" + (key != null ? key : "") + "|" + (value != null ? value : "") + "|" + expiresAtEpochMillis;
        return ChecksumUtil.calculateCrc32(payload) == checksum;
    }

    public static WalRecord parse(String line) throws IllegalArgumentException {
        String[] parts = line.split("\\|", -1);
        if (parts.length != 7) {
            throw new IllegalArgumentException("Invalid WAL line format, expected 7 parts: " + line);
        }
        long seq = Long.parseLong(parts[0]);
        long ts = Long.parseLong(parts[1]);
        WalOperation op = WalOperation.valueOf(parts[2]);
        String key = parts[3].isEmpty() ? null : parts[3];
        String val = parts[4].isEmpty() ? null : parts[4];
        long exp = Long.parseLong(parts[5]);
        long crc = Long.parseLong(parts[6]);

        WalRecord record = new WalRecord(seq, ts, op, key, val, exp, crc);
        if (!record.isValidChecksum()) {
            throw new IllegalArgumentException("Checksum mismatch on WAL record seq=" + seq);
        }
        return record;
    }
}
