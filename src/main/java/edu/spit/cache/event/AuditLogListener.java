package edu.spit.cache.event;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/** Writes an append-only JSON Lines audit stream without adding a JSON dependency. */
public final class AuditLogListener implements CacheEventListener, AutoCloseable {
    private final BufferedWriter writer;

    public AuditLogListener(Path path) throws IOException {
        Path absolute = path.toAbsolutePath();
        if (absolute.getParent() != null) Files.createDirectories(absolute.getParent());
        writer = Files.newBufferedWriter(
                absolute,
                StandardCharsets.UTF_8,
                StandardOpenOption.CREATE,
                StandardOpenOption.APPEND);
    }

    @Override
    public synchronized void onEvent(CacheEvent event) throws IOException {
        writer.write("{\"eventId\":" + event.eventId()
                + ",\"timestamp\":" + event.timestampEpochMillis()
                + ",\"type\":\"" + escape(event.type().name())
                + "\",\"key\":\"" + escape(event.key())
                + "\",\"transactionId\":\"" + escape(event.transactionId())
                + "\",\"detail\":\"" + escape(event.detail()) + "\"}");
        writer.newLine();
        writer.flush();
    }

    private static String escape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    @Override
    public synchronized void close() throws IOException { writer.close(); }
}
