/**
 * Request to av scan bus api
 */
export interface RequestBusAPIAVScanPayload {
    submissionId: string
    url: string
    fileName?: string
    moveFile: boolean
    cleanDestinationBucket: string
    quarantineDestinationBucket: string
    callbackOption: string
    callbackKafkaTopic: string
}

export interface RequestBusAPIAVScan {
    topic: string
    originator: string
    timestamp: string
    'mime-type': string
    payload: RequestBusAPIAVScanPayload
}
