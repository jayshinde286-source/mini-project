package edu.spit.cache.transaction;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

final class Transaction {
    enum State { ACTIVE, COMMITTED, ABORTED, TIMED_OUT }
    record Operation(boolean delete, String key, String value, long expiresAtEpochMillis) { }

    final String id;
    final long startedAtEpochMillis;
    final long deadlineEpochMillis;
    final List<Operation> operations = new ArrayList<>();
    final Set<String> lockedKeys = new HashSet<>();
    State state = State.ACTIVE;

    Transaction(String id, long startedAtEpochMillis, long timeoutMillis) {
        this.id = id;
        this.startedAtEpochMillis = startedAtEpochMillis;
        this.deadlineEpochMillis = startedAtEpochMillis + timeoutMillis;
    }

    boolean timedOut(long nowEpochMillis) { return nowEpochMillis >= deadlineEpochMillis; }

    String pendingValue(String key, String fallback) {
        for (int i = operations.size() - 1; i >= 0; i--) {
            Operation operation = operations.get(i);
            if (operation.key().equals(key)) return operation.delete() ? null : operation.value();
        }
        return fallback;
    }
}
