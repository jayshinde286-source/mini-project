package edu.spit.cache.persistence;

import java.nio.charset.StandardCharsets;
import java.util.zip.CRC32;

final class ChecksumUtil {
    private ChecksumUtil() { }

    static String crc32Hex(String payload) {
        CRC32 crc = new CRC32();
        crc.update(payload.getBytes(StandardCharsets.UTF_8));
        return Long.toHexString(crc.getValue()).toUpperCase();
    }
}
