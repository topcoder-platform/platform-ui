/**
 * Represents a programming problem in the problem library.
 */
export interface SourceProblem {
    problemId: string
    problemName: string
    /** Whether the problem has successfully passed its Docker test run. */
    isTested: boolean
    /** Whether the problem is flagged as ready for use in a contest. */
    isContestReady: boolean
    /** Human-readable test status: 'Pending Test' | 'Passed' | 'Failed' */
    status?: string
}
