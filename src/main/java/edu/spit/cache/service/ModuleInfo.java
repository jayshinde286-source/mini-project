package edu.spit.cache.service;

import edu.spit.cache.config.DurabilityMode;

import java.nio.file.Path;

public record ModuleInfo(
        String title,
        int entryCount,
        int activeTransactions,
        long lastWalSequence,
        Path walPath,
        Path snapshotPath,
        DurabilityMode durabilityMode,
        boolean asynchronousEvents) { }
