export interface SubmissionDownloadPermissionOptions {
    canViewSubmissions: boolean
    isOwnSubmission: boolean
}

/**
 * Determines whether a submission can be downloaded from the submissions tab.
 *
 * @param options permission inputs derived from challenge visibility and ownership
 * @param options.canViewSubmissions whether the user may access all submissions for the challenge
 * @param options.isOwnSubmission whether the submission belongs to the logged-in member
 * @returns true when the user can download the submission from the submissions tab
 */
export function canDownloadSubmissionFromSubmissionsTab(
    options: SubmissionDownloadPermissionOptions,
): boolean {
    const {
        canViewSubmissions,
        isOwnSubmission,
    }: SubmissionDownloadPermissionOptions = options

    return canViewSubmissions || isOwnSubmission
}
