package edu.spit.cache.persistence;

/** Supported operation types recorded in the Write-Ahead Log. */
public enum WalOperation {
    PUT,
    DELETE,
    CLEAR
}
