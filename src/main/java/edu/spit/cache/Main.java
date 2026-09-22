package edu.spit.cache;

import edu.spit.cache.cli.CommandHandler;
import edu.spit.cache.config.CacheConfig;
import edu.spit.cache.persistence.RecoveryReport;
import edu.spit.cache.service.PersistentEventDrivenCache;

/** Production-style bootstrap: configuration, recovery, CLI, and deterministic shutdown. */
public final class Main {
    private Main() { }

    public static void main(String[] args) {
        try (PersistentEventDrivenCache cache = PersistentEventDrivenCache.open(CacheConfig.fromSystemProperties())) {
            RecoveryReport recovery = cache.recoveryReport();
            System.out.printf(
                    "Recovered snapshot=%d, WAL operations=%d, skipped incomplete=%d, checksum failures=%d.%n",
                    recovery.snapshotEntriesRestored(),
                    recovery.walOperationsApplied(),
                    recovery.incompleteTransactionOperationsSkipped(),
                    recovery.checksumFailures());
            new CommandHandler(cache).run(System.in, System.out);
        } catch (Exception exception) {
            System.err.println("Fatal error: " + exception.getMessage());
            System.exit(1);
        }
    }
}
