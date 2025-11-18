/**
 * Request to reprocess submission bus api
 */
export interface SubmissionReprocessPayload {
    submissionId: string
    challengeId: string
    submissionUrl: string
    memberHandle: string
    memberId: string
    submittedDate: string
}

export interface RequestBusAPIReprocess {
    topic: string
    originator: string
    timestamp: string
    'mime-type': string
    payload: SubmissionReprocessPayload
}
