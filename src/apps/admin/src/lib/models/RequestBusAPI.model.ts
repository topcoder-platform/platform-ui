/**
 * Request to bus API
 */
export interface RequestBusAPI {
    topic: string
    originator: string
    timestamp: string
    'mime-type': string
    payload: {
        id: string
        submissionId: string
        resource: string
        testType: string
    }
}
