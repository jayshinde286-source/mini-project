package edu.spit.cache.service;

public record CheckpointReport(int entriesWritten, long walSequence, int walRecordsCompacted) { }
