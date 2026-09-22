package edu.spit.cache.persistence;

import edu.spit.cache.core.CacheEntry;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/** Atomic, checksummed snapshot that shortens startup recovery time. */
public final class SnapshotManager {
    private static final String MAGIC = "PEDS-CACHE-SNAPSHOT";
    private static final String VERSION = "1";
    private final Path path;

    public SnapshotManager(Path path) throws IOException {
        this.path = path.toAbsolutePath();
        if (this.path.getParent() != null) Files.createDirectories(this.path.getParent());
    }

    public synchronized void write(long lastWalSequence, Map<String, CacheEntry> entries) throws IOException {
        long createdAt = System.currentTimeMillis();
        StringBuilder content = new StringBuilder();
        content.append(MAGIC).append('\t').append(VERSION).append('\t')
                .append(lastWalSequence).append('\t').append(createdAt).append('\t').append(entries.size()).append('\n');
        for (CacheEntry entry : entries.values()) {
            String payload = String.join("\t",
                    encode(entry.key()),
                    encode(entry.value()),
                    Long.toString(entry.version()),
                    Long.toString(entry.createdAtEpochMillis()),
                    Long.toString(entry.expiresAtEpochMillis()));
            content.append(payload).append('\t').append(ChecksumUtil.crc32Hex(payload)).append('\n');
        }
        Path temporary = path.resolveSibling(path.getFileName() + ".tmp");
        try (FileChannel channel = FileChannel.open(
                temporary,
                StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING,
                StandardOpenOption.WRITE)) {
            ByteBuffer buffer = StandardCharsets.UTF_8.encode(content.toString());
            while (buffer.hasRemaining()) channel.write(buffer);
            channel.force(true);
        }
        atomicReplace(temporary, path);
    }

    public synchronized SnapshotData read() throws IOException {
        if (!Files.exists(path) || Files.size(path) == 0) return SnapshotData.empty();
        var lines = Files.readAllLines(path, StandardCharsets.UTF_8);
        if (lines.isEmpty()) return SnapshotData.empty();
        String[] header = lines.get(0).split("\t", -1);
        if (header.length != 5 || !MAGIC.equals(header[0]) || !VERSION.equals(header[1])) {
            throw new IOException("invalid snapshot header");
        }
        long lastSequence = Long.parseLong(header[2]);
        long createdAt = Long.parseLong(header[3]);
        int expectedCount = Integer.parseInt(header[4]);
        Map<String, CacheEntry> entries = new LinkedHashMap<>();
        for (int lineNumber = 1; lineNumber < lines.size(); lineNumber++) {
            String[] parts = lines.get(lineNumber).split("\t", -1);
            if (parts.length != 6) throw new IOException("invalid snapshot entry at line " + (lineNumber + 1));
            String payload = String.join("\t", java.util.Arrays.copyOf(parts, 5));
            if (!ChecksumUtil.crc32Hex(payload).equalsIgnoreCase(parts[5])) {
                throw new IOException("snapshot checksum mismatch at line " + (lineNumber + 1));
            }
            CacheEntry entry = new CacheEntry(
                    decode(parts[0]),
                    decode(parts[1]),
                    Long.parseLong(parts[2]),
                    Long.parseLong(parts[3]),
                    Long.parseLong(parts[4]));
            entries.put(entry.key(), entry);
        }
        if (entries.size() != expectedCount) throw new IOException("snapshot entry count mismatch");
        return new SnapshotData(lastSequence, createdAt, entries);
    }

    public Path path() { return path; }

    private static String encode(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String decode(String value) {
        return new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8);
    }

    private static void atomicReplace(Path source, Path target) throws IOException {
        try {
            Files.move(source, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException ignored) {
            Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }
}
