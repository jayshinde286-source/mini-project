package edu.spit.cache.persistence;

/** Operation vocabulary persisted in the versioned write-ahead log. */
public enum WalOperation {
    SET,
    CAS,
    DELETE,
    EXPIRE,
    BEGIN,
    TX_SET,
    TX_DELETE,
    COMMIT,
    ABORT
}
