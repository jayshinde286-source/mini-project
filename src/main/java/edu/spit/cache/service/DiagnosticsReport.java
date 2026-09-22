package edu.spit.cache.service;

import edu.spit.cache.core.InvariantReport;
import edu.spit.cache.event.EventBus;
import edu.spit.cache.metrics.MetricsSnapshot;
import edu.spit.cache.persistence.RecoveryReport;

/** Immutable, one-command evidence bundle for operations and ESE demonstration. */
public record DiagnosticsReport(
        long generatedAtEpochMillis,
        long uptimeMillis,
        ModuleInfo module,
        InvariantReport invariants,
        MetricsSnapshot metrics,
        RecoveryReport recovery,
        EventBus.Statistics events,
        long walBytes,
        long snapshotBytes,
        long auditBytes) { }
