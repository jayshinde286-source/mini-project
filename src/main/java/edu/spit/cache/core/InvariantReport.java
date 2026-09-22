package edu.spit.cache.core;

import java.util.List;

/** Health report produced by comparing the primary map and ordered index. */
public record InvariantReport(boolean healthy, int entryCount, int indexCount, List<String> problems) {
    public InvariantReport {
        problems = List.copyOf(problems);
    }
}
