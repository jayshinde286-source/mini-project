package edu.spit.cache.event;

/** Domain and operational events emitted by the module. */
public enum CacheEventType {
    PUT,
    DELETE,
    HIT,
    MISS,
    EXPIRED,
    CAS_SUCCEEDED,
    CAS_REJECTED,
    TRANSACTION_BEGAN,
    TRANSACTION_COMMITTED,
    TRANSACTION_ROLLED_BACK,
    TRANSACTION_CONFLICT,
    TRANSACTION_TIMED_OUT,
    RANGE_QUERIED,
    SNAPSHOT_CREATED,
    WAL_COMPACTED,
    RECOVERY_COMPLETED,
    INVARIANT_CHECKED
}
