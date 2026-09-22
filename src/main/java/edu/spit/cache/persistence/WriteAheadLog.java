package edu.spit.cache.persistence;

import edu.spit.cache.config.DurabilityMode;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.channels.OverlappingFileLockException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/** Append-only, checksummed WAL. Transaction batches are written and fsynced together. */
public final class WriteAheadLog implements AutoCloseable {
    private final Path path;
    private final DurabilityMode durabilityMode;
    private final AtomicLong sequence = new AtomicLong();
    private final FileChannel lockChannel;
    private final FileLock processLock;
    private FileChannel channel;

    public WriteAheadLog(Path path, DurabilityMode durabilityMode) throws IOException {
        this.path = path.toAbsolutePath();
        this.durabilityMode = durabilityMode;
        if (this.path.getParent() != null) Files.createDirectories(this.path.getParent());
        Path lockPath = this.path.resolveSibling(this.path.getFileName() + ".lock");
        this.lockChannel = FileChannel.open(lockPath, StandardOpenOption.CREATE, StandardOpenOption.WRITE);
        try {
            this.processLock = lockChannel.tryLock();
        } catch (OverlappingFileLockException alreadyOpenInProcess) {
            lockChannel.close();
            throw new IOException("WAL is already open by another cache instance: " + this.path, alreadyOpenInProcess);
        }
        if (this.processLock == null) {
            lockChannel.close();
            throw new IOException("WAL is already open by another process: " + this.path);
        }
        if (!Files.exists(this.path)) Files.createFile(this.path);
        try {
            WalReadResult existing = readPath();
            existing.records().stream().mapToLong(WalRecord::sequence).max().ifPresent(sequence::set);
            openChannel();
        } catch (IOException | RuntimeException startupFailure) {
            processLock.release();
            lockChannel.close();
            throw startupFailure;
        }
    }

    public synchronized WalRecord append(WalDraft draft) throws IOException {
        return appendBatch(List.of(draft)).get(0);
    }

    public synchronized List<WalRecord> appendBatch(List<WalDraft> drafts) throws IOException {
        if (drafts.isEmpty()) return List.of();
        long now = System.currentTimeMillis();
        List<WalRecord> records = new ArrayList<>(drafts.size());
        StringBuilder encoded = new StringBuilder();
        for (WalDraft draft : drafts) {
            WalRecord record = new WalRecord(
                    sequence.incrementAndGet(),
                    now,
                    draft.transactionId(),
                    draft.operation(),
                    draft.key(),
                    draft.value(),
                    draft.expiresAtEpochMillis());
            records.add(record);
            encoded.append(record.serialize()).append('\n');
        }
        ByteBuffer buffer = StandardCharsets.UTF_8.encode(encoded.toString());
        channel.position(channel.size());
        while (buffer.hasRemaining()) channel.write(buffer);
        if (durabilityMode == DurabilityMode.ALWAYS) channel.force(true);
        return List.copyOf(records);
    }

    public synchronized WalReadResult readAll() throws IOException {
        if (durabilityMode == DurabilityMode.ALWAYS) channel.force(false);
        return readPath();
    }

    /** Removes records covered by a durable snapshot while preserving later writes. */
    public synchronized int compactUpTo(long inclusiveSequence) throws IOException {
        WalReadResult read = readPath();
        List<WalRecord> retained = read.records().stream()
                .filter(record -> record.sequence() > inclusiveSequence)
                .sorted(Comparator.comparingLong(WalRecord::sequence))
                .toList();
        Path temporary = path.resolveSibling(path.getFileName() + ".compact.tmp");
        StringBuilder content = new StringBuilder();
        retained.forEach(record -> content.append(record.serialize()).append('\n'));
        try (FileChannel temporaryChannel = FileChannel.open(
                temporary,
                StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING,
                StandardOpenOption.WRITE)) {
            ByteBuffer buffer = StandardCharsets.UTF_8.encode(content.toString());
            while (buffer.hasRemaining()) temporaryChannel.write(buffer);
            temporaryChannel.force(true);
        }
        channel.close();
        atomicReplace(temporary, path);
        openChannel();
        return read.records().size() - retained.size();
    }

    public long lastSequence() { return sequence.get(); }
    public void ensureMinimumSequence(long minimumSequence) {
        sequence.accumulateAndGet(minimumSequence, Math::max);
    }
    public Path path() { return path; }

    private WalReadResult readPath() throws IOException {
        List<WalRecord> records = new ArrayList<>();
        int malformed = 0;
        int checksumFailures = 0;
        long legacySequence = 0;
        for (String line : Files.readAllLines(path, StandardCharsets.UTF_8)) {
            if (line.isBlank()) continue;
            try {
                WalRecord record = line.startsWith("V2\t")
                        ? WalRecord.parseV2(line)
                        : WalRecord.parseLegacy(line, ++legacySequence);
                records.add(record);
                legacySequence = Math.max(legacySequence, record.sequence());
            } catch (IllegalStateException checksumFailure) {
                checksumFailures++;
            } catch (RuntimeException malformedRecord) {
                malformed++;
            }
        }
        records.sort(Comparator.comparingLong(WalRecord::sequence));
        return new WalReadResult(records, malformed, checksumFailures);
    }

    private void openChannel() throws IOException {
        channel = FileChannel.open(path, StandardOpenOption.CREATE, StandardOpenOption.READ, StandardOpenOption.WRITE);
    }

    private static void atomicReplace(Path source, Path target) throws IOException {
        try {
            Files.move(source, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException ignored) {
            Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    @Override
    public synchronized void close() throws IOException {
        IOException failure = null;
        try {
            if (channel != null && channel.isOpen()) channel.close();
        } catch (IOException closeFailure) {
            failure = closeFailure;
        }
        try {
            if (processLock.isValid()) processLock.release();
        } catch (IOException closeFailure) {
            if (failure == null) failure = closeFailure;
            else failure.addSuppressed(closeFailure);
        }
        try {
            if (lockChannel.isOpen()) lockChannel.close();
        } catch (IOException closeFailure) {
            if (failure == null) failure = closeFailure;
            else failure.addSuppressed(closeFailure);
        }
        if (failure != null) throw failure;
    }
}
