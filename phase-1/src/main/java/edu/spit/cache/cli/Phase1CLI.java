package edu.spit.cache.cli;

import edu.spit.cache.persistence.RecoveryReport;
import edu.spit.cache.service.Phase1CacheService;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;

/** Interactive command-line shell for Phase 1 demonstration and evaluation. */
public final class Phase1CLI {
    private final Path walPath;

    public Phase1CLI(Path walPath) {
        this.walPath = walPath;
    }

    public void start() {
        System.out.println("================================================================================");
        System.out.println("   SPIT MINI PROJECT - PHASE 1 PERSISTENT MEMORY CACHE SHELL");
        System.out.println("   Course: Computer Science & Engineering | Academic Year 2026-27");
        System.out.println("   Students: Jay Shinde (2024800115), Sanchit Gaikwad, Nikhil Shelar");
        System.out.println("   Supervisor: Prof. Suhas Kakade");
        System.out.println("================================================================================");
        System.out.println("WAL Path: " + walPath.toAbsolutePath());
        System.out.println("Type 'HELP' for available commands or 'EXIT' to quit.\n");

        try (Phase1CacheService service = new Phase1CacheService(walPath);
             BufferedReader reader = new BufferedReader(new InputStreamReader(System.in))) {

            System.out.println("[Startup] Initialized cache & replayed WAL file.");
            System.out.println("[Active Keys]: " + service.getActiveKeyCount() + "\n");

            String line;
            while (true) {
                System.out.print("phase1-cache> ");
                line = reader.readLine();
                if (line == null) break;
                line = line.trim();
                if (line.isEmpty()) continue;

                String[] parts = line.split("\\s+", 3);
                String cmd = parts[0].toUpperCase();

                if (cmd.equals("EXIT") || cmd.equals("QUIT")) {
                    System.out.println("Shutting down Phase 1 Cache CLI. Goodbye!");
                    break;
                }

                switch (cmd) {
                    case "SET", "PUT" -> handleSet(service, parts);
                    case "GET" -> handleGet(service, parts);
                    case "DELETE", "DEL", "REMOVE" -> handleDelete(service, parts);
                    case "CLEAR" -> handleClear(service);
                    case "RECOVER" -> handleRecover(service);
                    case "METRICS" -> System.out.println(service.getMetrics().formatSummary());
                    case "STATUS" -> handleStatus(service);
                    case "CRASH", "SIMULATE_CRASH" -> handleCrash(service);
                    case "HELP" -> printHelp();
                    default -> System.out.println("Unknown command: '" + cmd + "'. Type 'HELP' for command usage.");
                }
            }
        } catch (Exception ex) {
            System.err.println("Fatal Error in CLI: " + ex.getMessage());
            ex.printStackTrace();
        }
    }

    private void handleSet(Phase1CacheService service, String[] parts) {
        if (parts.length < 3) {
            System.out.println("Usage: SET <key> <value> [ttl_ms]");
            return;
        }
        String key = parts[1];
        String valWithTtl = parts[2];
        long ttl = 0L;

        String[] subParts = valWithTtl.split("\\s+");
        String value = subParts[0];
        if (subParts.length > 1) {
            try {
                ttl = Long.parseLong(subParts[1]);
            } catch (NumberFormatException e) {
                value = valWithTtl; // entire remainder is the value
            }
        }

        try {
            boolean ok = service.put(key, value, ttl);
            if (ok) {
                System.out.println("OK -> Key '" + key + "' set to '" + value + "'" + (ttl > 0 ? " (TTL: " + ttl + "ms)" : ""));
            } else {
                System.out.println("REJECTED -> Stale update for key '" + key + "'");
            }
        } catch (Exception e) {
            System.out.println("ERROR: " + e.getMessage());
        }
    }

    private void handleGet(Phase1CacheService service, String[] parts) {
        if (parts.length < 2) {
            System.out.println("Usage: GET <key>");
            return;
        }
        String key = parts[1];
        String val = service.get(key);
        if (val != null) {
            System.out.println("VALUE: " + val);
        } else {
            System.out.println("(nil) -> Key not found or expired");
        }
    }

    private void handleDelete(Phase1CacheService service, String[] parts) {
        if (parts.length < 2) {
            System.out.println("Usage: DELETE <key>");
            return;
        }
        String key = parts[1];
        try {
            boolean removed = service.delete(key);
            if (removed) {
                System.out.println("OK -> Deleted key '" + key + "'");
            } else {
                System.out.println("(nil) -> Key not found");
            }
        } catch (Exception e) {
            System.out.println("ERROR: " + e.getMessage());
        }
    }

    private void handleClear(Phase1CacheService service) {
        try {
            service.clear();
            System.out.println("OK -> Cleared all keys from memory and logged CLEAR to WAL.");
        } catch (Exception e) {
            System.out.println("ERROR: " + e.getMessage());
        }
    }

    private void handleRecover(Phase1CacheService service) {
        try {
            RecoveryReport report = service.recover();
            System.out.println(report.formatSummary());
            System.out.println("Active Keys After Replay: " + service.getActiveKeyCount());
        } catch (Exception e) {
            System.out.println("ERROR during recovery: " + e.getMessage());
        }
    }

    private void handleStatus(Phase1CacheService service) {
        System.out.println("--------------------------------------------------------------------------------");
        System.out.println("PHASE 1 CACHE STATUS REPORT");
        System.out.println("--------------------------------------------------------------------------------");
        System.out.println("Active In-Memory Keys : " + service.getActiveKeyCount());
        System.out.println("WAL File Path         : " + service.getWal().getPath());
        System.out.println("WAL Last Sequence #   : " + service.getWal().getCurrentSequence());
        System.out.println("Metrics               : " + service.getMetrics().formatSummary());
        System.out.println("--------------------------------------------------------------------------------");
    }

    private void handleCrash(Phase1CacheService service) {
        System.out.println("\n[CRASH DEMONSTRATION]");
        System.out.println("Wiping in-memory cache data without deleting WAL file...");
        service.getEngine().clear();
        System.out.println("In-Memory Active Keys count is now: " + service.getActiveKeyCount());
        System.out.println("Notice: Data is temporarily lost from memory! Executing WAL recovery replay...");
        try {
            RecoveryReport report = service.recover();
            System.out.println(report.formatSummary());
            System.out.println("In-Memory Active Keys count restored to: " + service.getActiveKeyCount());
            System.out.println(">>> CRASH RECOVERY SUCCESSFUL! Data preserved via Write-Ahead Logging! <<<\n");
        } catch (Exception e) {
            System.out.println("ERROR during crash recovery: " + e.getMessage());
        }
    }

    private void printHelp() {
        System.out.println("""
                Available Commands in Phase 1:
                  SET <key> <val> [ttl_ms] : Store key-value pair with optional TTL expiry
                  GET <key>                : Fetch value for key
                  DELETE <key>             : Remove key from cache and append WAL record
                  CLEAR                    : Wipe all entries and log CLEAR operation
                  RECOVER                  : Replay WAL to rebuild cache state
                  CRASH                    : Wipe memory & replay WAL to demonstrate crash recovery
                  METRICS                  : View hit, miss, put, delete counters and hit ratio
                  STATUS                   : Display module status and sequence numbers
                  HELP                     : Show this help summary
                  EXIT                     : Exit the shell
                """);
    }
}
