package edu.spit.cache.persistence;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.channels.OverlappingFileLockException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/** Append-only checksummed Write-Ahead Log manager for Phase 1. */
public final class WriteAheadLog implements AutoCloseable {
    private final Path path;
    private final AtomicLong sequence = new AtomicLong();
    private final FileChannel lockChannel;
    private final FileLock processLock;
    private FileChannel channel;

    public WriteAheadLog(Path path) throws IOException {
        this.path = path.toAbsolutePath();
        if (this.path.getParent() != null) {
            Files.createDirectories(this.path.getParent());
        }

        Path lockPath = this.path.resolveSibling(this.path.getFileName() + ".lock");
        this.lockChannel = FileChannel.open(lockPath, StandardOpenOption.CREATE, StandardOpenOption.WRITE);
        try {
            this.processLock = lockChannel.tryLock();
        } catch (OverlappingFileLockException ex) {
            lockChannel.close();
            throw new IOException("WAL lock file is already acquired: " + lockPath, ex);
        }
        if (this.processLock == null) {
            lockChannel.close();
            throw new IOException("WAL is already locked by another process: " + lockPath);
        }

        if (!Files.exists(this.path)) {
            Files.createFile(this.path);
        }

        WalReadResult existing = readPath();
        existing.records().stream().mapToLong(WalRecord::sequence).max().ifPresent(sequence::set);
        openChannel();
    }

    private void openChannel() throws IOException {
        this.channel = FileChannel.open(path, StandardOpenOption.CREATE, StandardOpenOption.READ, StandardOpenOption.WRITE);
    }

    public synchronized WalRecord append(WalOperation op, String key, String value, long expiresAt) throws IOException {
        long seq = sequence.incrementAndGet();
        WalRecord record = WalRecord.create(seq, op, key, value, expiresAt);
        String serialized = record.serialize() + "\n";
        ByteBuffer buffer = StandardCharsets.UTF_8.encode(serialized);
        channel.position(channel.size());
        while (buffer.hasRemaining()) {
            channel.write(buffer);
        }
        channel.force(true);
        return record;
    }

    public synchronized WalReadResult readAll() throws IOException {
        channel.force(false);
        return readPath();
    }

    private WalReadResult readPath() throws IOException {
        List<WalRecord> records = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int valid = 0;
        int corrupted = 0;

        if (Files.exists(path)) {
            try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
                String line;
                int lineNumber = 0;
                while ((line = reader.readLine()) != null) {
                    lineNumber++;
                    if (line.isBlank()) continue;
                    try {
                        WalRecord record = WalRecord.parse(line);
                        records.add(record);
                        valid++;
                    } catch (Exception ex) {
                        corrupted++;
                        errors.add("Line " + lineNumber + ": " + ex.getMessage());
                    }
                }
            }
        }
        return new WalReadResult(List.copyOf(records), valid, corrupted, List.copyOf(errors));
    }

    public Path getPath() {
        return path;
    }

    public long getCurrentSequence() {
        return sequence.get();
    }

    @Override
    public synchronized void close() throws IOException {
        if (channel != null && channel.isOpen()) {
            channel.close();
        }
        if (processLock != null && processLock.isValid()) {
            processLock.release();
        }
        if (lockChannel != null && lockChannel.isOpen()) {
            lockChannel.close();
        }
    }
}
