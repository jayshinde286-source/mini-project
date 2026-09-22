package edu.spit.cache.config;

/** Controls when WAL bytes are forced from the operating-system cache to disk. */
public enum DurabilityMode {
    /** Flush and fsync every logical write or transaction batch. */
    ALWAYS,
    /** Write to the file but let the operating system decide when to fsync. */
    OS_BUFFERED;

    public static DurabilityMode parse(String value) {
        try {
            return valueOf(value.trim().toUpperCase());
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("durability must be ALWAYS or OS_BUFFERED", exception);
        }
    }
}
