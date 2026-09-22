package edu.spit.cache.test;

/** Test suite runner executing Phase 1 unit and integration tests. */
public final class AllPhase1Tests {
    public static void main(String[] args) {
        System.out.println("================================================================================");
        System.out.println("   SPIT MINI PROJECT - PHASE 1 VERIFICATION TEST SUITE");
        System.out.println("================================================================================");
        try {
            Phase1UnitTests.runAll();
            Phase1IntegrationTests.runAll();
            System.out.println("================================================================================");
            System.out.println("   SUMMARY: ALL PHASE 1 TESTS PASSED SUCCESSFULLY! (100% VERIFIED)");
            System.out.println("================================================================================");
        } catch (Throwable ex) {
            System.err.println("TEST FAILURE: " + ex.getMessage());
            ex.printStackTrace();
            System.exit(1);
        }
    }
}
