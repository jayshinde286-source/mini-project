package edu.spit.cache;

import edu.spit.cache.cli.Phase1CLI;

import java.nio.file.Path;
import java.nio.file.Paths;

/** Bootstrap entry point for Phase 1 Persistent Memory Cache Module. */
public final class Main {
    public static void main(String[] args) {
        Path walPath = Paths.get("data", "phase1_wal.log");
        if (args.length > 0 && !args[0].isBlank()) {
            walPath = Paths.get(args[0]);
        }
        
        Phase1CLI cli = new Phase1CLI(walPath);
        cli.start();
    }
}
