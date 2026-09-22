package edu.spit.cache.event;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/** Ordered event dispatcher. A single worker preserves event order and isolates listener failures. */
public final class EventBus implements AutoCloseable {
    public record Statistics(long published, long deliveries, long listenerFailures) {}

    private final List<CacheEventListener> listeners = new CopyOnWriteArrayList<>();
    private final AtomicLong eventSequence = new AtomicLong();
    private final AtomicLong deliveries = new AtomicLong();
    private final AtomicLong listenerFailures = new AtomicLong();
    private final AtomicBoolean closed = new AtomicBoolean();
    private final boolean asynchronous;
    private final ExecutorService dispatcher;

    public EventBus(boolean asynchronous) {
        this.asynchronous = asynchronous;
        this.dispatcher = asynchronous
                ? Executors.newSingleThreadExecutor(runnable -> {
                    Thread thread = new Thread(runnable, "cache-event-dispatcher");
                    thread.setDaemon(true);
                    return thread;
                })
                : null;
    }

    public AutoCloseable subscribe(CacheEventListener listener) {
        if (listener == null) throw new IllegalArgumentException("listener is required");
        if (closed.get()) throw new IllegalStateException("event bus is closed");
        listeners.add(listener);
        return () -> listeners.remove(listener);
    }

    public CacheEvent publish(CacheEventType type, String key, String transactionId, String detail) {
        return publish(type, key, transactionId, detail, Map.of());
    }

    public CacheEvent publish(CacheEventType type, String key, String transactionId, String detail, Map<String, String> attributes) {
        if (closed.get()) throw new IllegalStateException("event bus is closed");
        CacheEvent event = new CacheEvent(
                eventSequence.incrementAndGet(),
                System.currentTimeMillis(),
                type,
                key,
                transactionId,
                detail,
                attributes);
        if (asynchronous) dispatcher.execute(() -> deliver(event));
        else deliver(event);
        return event;
    }

    public boolean awaitQuiescence(Duration timeout) throws InterruptedException {
        if (!asynchronous) return true;
        CountDownLatch latch = new CountDownLatch(1);
        dispatcher.execute(latch::countDown);
        return latch.await(timeout.toMillis(), TimeUnit.MILLISECONDS);
    }

    public Statistics statistics() {
        return new Statistics(eventSequence.get(), deliveries.get(), listenerFailures.get());
    }

    private void deliver(CacheEvent event) {
        for (CacheEventListener listener : listeners) {
            try {
                listener.onEvent(event);
                deliveries.incrementAndGet();
            } catch (Exception ignored) {
                listenerFailures.incrementAndGet();
            }
        }
    }

    @Override
    public void close() {
        if (!closed.compareAndSet(false, true) || dispatcher == null) return;
        dispatcher.shutdown();
        try {
            if (!dispatcher.awaitTermination(5, TimeUnit.SECONDS)) dispatcher.shutdownNow();
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            dispatcher.shutdownNow();
        }
    }
}
