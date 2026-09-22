package edu.spit.cache.persistence;

import java.nio.charset.StandardCharsets;
import java.util.zip.CRC32;

/** Utility for CRC32 checksum generation and verification of WAL records. */
public final class ChecksumUtil {
    private ChecksumUtil() {}

    public static long calculateCrc32(String content) {
        CRC32 crc = new CRC32();
        crc.update(content.getBytes(StandardCharsets.UTF_8));
        return crc.getValue();
    }
}
