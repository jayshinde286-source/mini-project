package edu.spit.cache.cli;

import edu.spit.cache.api.CacheValue;
import edu.spit.cache.api.CompareAndSetResult;
import edu.spit.cache.core.InvariantReport;
import edu.spit.cache.event.CacheEvent;
import edu.spit.cache.metrics.MetricsSnapshot;
import edu.spit.cache.persistence.RecoveryReport;
import edu.spit.cache.service.CheckpointReport;
import edu.spit.cache.service.DiagnosticsReport;
import edu.spit.cache.service.ModuleInfo;
import edu.spit.cache.service.PersistentEventDrivenCache;

import java.io.IOException;
import java.io.InputStream;
import java.io.PrintStream;
import java.util.Locale;
import java.util.Map;
import java.util.Scanner;

/** Administrative CLI used for demonstration, recovery drills, and viva evidence. */
public final class CommandHandler {
    private final PersistentEventDrivenCache cache;

    public CommandHandler(PersistentEventDrivenCache cache) { this.cache = cache; }

    public void run(InputStream input, PrintStream output) {
        output.println(PersistentEventDrivenCache.PROJECT_TITLE);
        output.println("Type HELP for commands.");
        Scanner scanner = new Scanner(input);
        while (true) {
            output.print("cache> ");
            if (!scanner.hasNextLine()) break;
            String line = scanner.nextLine().trim();
            if (line.isEmpty()) continue;
            try {
                if (!execute(line, output)) break;
            } catch (Exception exception) {
                output.println("ERROR: " + exception.getMessage());
            }
        }
    }

    public boolean execute(String line, PrintStream output) throws Exception {
        String[] first = line.trim().split("\\s+", 2);
        String command = first[0].toUpperCase(Locale.ROOT);
        String rest = first.length == 2 ? first[1].trim() : "";
        switch (command) {
            case "SET" -> {
                String[] args = arguments(rest, 2);
                printValue(cache.put(args[0], args[1]), output);
            }
            case "SETEX" -> {
                String[] args = arguments(rest, 3);
                printValue(cache.put(args[0], args[2], positiveLong(args[1], "TTL")), output);
            }
            case "GET" -> output.println(cache.get(one(rest)).map(CacheValue::value).orElse("(nil)"));
            case "GETMETA" -> cache.get(one(rest)).ifPresentOrElse(
                    value -> printValue(value, output),
                    () -> output.println("(nil)"));
            case "DELETE", "DEL" -> output.println(cache.delete(one(rest)) ? "DELETED" : "NOT FOUND");
            case "SHOW" -> printMap(cache.all(), output);
            case "RANGE" -> {
                String[] args = arguments(rest, 2);
                printMap(cache.range(args[0], args[1]), output);
            }
            case "CAS" -> {
                String[] args = arguments(rest, 3);
                CompareAndSetResult result = cache.compareAndSet(args[0], Long.parseLong(args[1]), args[2], 0);
                output.println(result.updated() ? "UPDATED version=" + result.observedVersion() : "REJECTED observed=" + result.observedVersion());
            }
            case "BEGIN" -> output.println(cache.transactions().begin());
            case "TGET" -> {
                String[] args = arguments(rest, 2);
                String value = cache.transactions().read(args[0], args[1]);
                output.println(value == null ? "(nil)" : value);
            }
            case "TSET" -> {
                String[] args = arguments(rest, 3);
                cache.transactions().set(args[0], args[1], args[2]);
                output.println("QUEUED");
            }
            case "TSETEX" -> {
                String[] args = arguments(rest, 4);
                cache.transactions().set(args[0], args[1], args[3], positiveLong(args[2], "TTL"));
                output.println("QUEUED");
            }
            case "TDELETE", "TDEL" -> {
                String[] args = arguments(rest, 2);
                cache.transactions().delete(args[0], args[1]);
                output.println("QUEUED");
            }
            case "COMMIT" -> {
                cache.transactions().commit(one(rest));
                output.println("COMMITTED");
            }
            case "ROLLBACK" -> {
                cache.transactions().rollback(one(rest));
                output.println("ROLLED BACK");
            }
            case "CHECKPOINT" -> {
                if (!rest.isBlank() && !rest.equalsIgnoreCase("COMPACT")) {
                    throw new IllegalArgumentException("CHECKPOINT accepts only optional COMPACT");
                }
                printCheckpoint(cache.checkpoint(rest.equalsIgnoreCase("COMPACT")), output);
            }
            case "METRICS" -> printMetrics(cache.metrics(), output);
            case "EVENTS" -> printEvents(cache.recentEvents(rest.isBlank() ? 10 : Integer.parseInt(rest)), output);
            case "HEALTH", "VALIDATE" -> printHealth(cache.validate(), output);
            case "INFO" -> printInfo(cache.info(), output);
            case "RECOVERY" -> printRecovery(cache.recoveryReport(), output);
            case "DIAGNOSTICS", "EVIDENCE" -> printDiagnostics(cache.diagnostics(), output);
            case "HELP" -> output.println(help());
            case "EXIT", "QUIT" -> { return false; }
            default -> throw new IllegalArgumentException("unknown command; type HELP");
        }
        return true;
    }

    private static void printValue(CacheValue value, PrintStream output) {
        output.printf("OK value=%s version=%d ttlMs=%d%n",
                value.value(), value.version(), value.ttlMillis(System.currentTimeMillis()));
    }

    private static void printMap(Map<String, CacheValue> values, PrintStream output) {
        if (values.isEmpty()) output.println("(empty)");
        else values.forEach((key, value) -> output.printf("%s = %s [v%d]%n", key, value.value(), value.version()));
    }

    private static void printMetrics(MetricsSnapshot metrics, PrintStream output) {
        output.printf("hits=%d misses=%d hitRate=%.2f%% puts=%d deletes=%d expired=%d%n",
                metrics.hits(), metrics.misses(), metrics.hitRatePercent(), metrics.puts(), metrics.deletes(), metrics.expirations());
        output.printf("casSuccess=%d casRejected=%d txCommit=%d txRollback=%d txConflict=%d snapshots=%d recoveries=%d%n",
                metrics.casSuccesses(), metrics.casRejections(), metrics.transactionCommits(), metrics.transactionRollbacks(),
                metrics.transactionConflicts(), metrics.snapshots(), metrics.recoveries());
    }

    private static void printEvents(java.util.List<CacheEvent> events, PrintStream output) {
        if (events.isEmpty()) output.println("(no events)");
        else events.forEach(event -> output.printf("#%d %s key=%s tx=%s %s%n",
                event.eventId(), event.type(), blankAsDash(event.key()), blankAsDash(event.transactionId()), event.detail()));
    }

    private static void printCheckpoint(CheckpointReport report, PrintStream output) {
        output.printf("CHECKPOINT entries=%d walSequence=%d compacted=%d%n",
                report.entriesWritten(), report.walSequence(), report.walRecordsCompacted());
    }

    private static void printHealth(InvariantReport report, PrintStream output) {
        output.printf("%s entries=%d index=%d problems=%s%n",
                report.healthy() ? "HEALTHY" : "UNHEALTHY", report.entryCount(), report.indexCount(), report.problems());
    }

    private static void printInfo(ModuleInfo info, PrintStream output) {
        output.println(info.title());
        output.printf("entries=%d activeTx=%d walSequence=%d durability=%s asyncEvents=%s%n",
                info.entryCount(), info.activeTransactions(), info.lastWalSequence(), info.durabilityMode(), info.asynchronousEvents());
        output.println("wal=" + info.walPath());
        output.println("snapshot=" + info.snapshotPath());
    }

    private static void printRecovery(RecoveryReport report, PrintStream output) {
        output.printf("snapshot=%d walApplied=%d incompleteSkipped=%d rejectedTxBatches=%d legacyTxBatches=%d "
                        + "expiredSkipped=%d malformed=%d checksumFailures=%d%n",
                report.snapshotEntriesRestored(), report.walOperationsApplied(), report.incompleteTransactionOperationsSkipped(),
                report.rejectedTransactionBatches(), report.legacyTransactionBatchesAccepted(),
                report.expiredEntriesSkipped(), report.malformedWalRecords(), report.checksumFailures());
    }

    private static void printDiagnostics(DiagnosticsReport report, PrintStream output) {
        output.printf("DIAGNOSTICS generatedAt=%d uptimeMs=%d health=%s entries=%d activeTx=%d%n",
                report.generatedAtEpochMillis(), report.uptimeMillis(),
                report.invariants().healthy() ? "HEALTHY" : "UNHEALTHY",
                report.module().entryCount(), report.module().activeTransactions());
        output.printf("STORAGE walBytes=%d snapshotBytes=%d auditBytes=%d walSequence=%d durability=%s%n",
                report.walBytes(), report.snapshotBytes(), report.auditBytes(),
                report.module().lastWalSequence(), report.module().durabilityMode());
        output.printf("EVENTS published=%d deliveries=%d listenerFailures=%d%n",
                report.events().published(), report.events().deliveries(), report.events().listenerFailures());
        printRecovery(report.recovery(), output);
        printMetrics(report.metrics(), output);
    }

    private static String help() {
        return """
                DATA        SET key value | SETEX key ttlMs value | GET key | GETMETA key | DELETE key
                QUERY       SHOW | RANGE first last | CAS key expectedVersion value
                TRANSACTION BEGIN | TGET tx key | TSET tx key value | TSETEX tx key ttlMs value
                            TDELETE tx key | COMMIT tx | ROLLBACK tx
                OPERATIONS  CHECKPOINT [COMPACT] | METRICS | EVENTS [count] | HEALTH | INFO | RECOVERY
                            DIAGNOSTICS (alias EVIDENCE)
                SESSION     HELP | EXIT
                """;
    }

    private static String[] arguments(String text, int count) {
        String[] values = text.split("\\s+", count);
        if (values.length != count || values[0].isBlank()) throw new IllegalArgumentException("expected " + count + " argument(s)");
        return values;
    }

    private static String one(String text) {
        if (text.isBlank() || text.matches(".*\\s+.*")) throw new IllegalArgumentException("expected one argument");
        return text;
    }

    private static long positiveLong(String value, String label) {
        long parsed = Long.parseLong(value);
        if (parsed <= 0) throw new IllegalArgumentException(label + " must be positive");
        return parsed;
    }

    private static String blankAsDash(String value) { return value.isBlank() ? "-" : value; }
}
