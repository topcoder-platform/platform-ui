/**
 * App config for bus event
 */
import { v4 as uuidv4 } from 'uuid'

import {
    RequestBusAPI,
    RequestBusAPIAVScan,
    RequestBusAPIAVScanPayload,
} from '../lib/models'

/**
 * Create data for data submission marathon match bus event
 * @param submissionId submission id
 * @param testType test type
 * @returns data for bus event
 */
export const CREATE_BUS_EVENT_DATA_SUBMISSION_MARATHON_MATCH = (
    submissionId: string,
    testType: string,
): RequestBusAPI => ({
    'mime-type': 'application/json',
    originator: 'MMFinalScoreProcessor',
    payload: {
        id: uuidv4(),
        resource: 'score',
        submissionId,
        testType,
    },
    timestamp: new Date()
        .toISOString(),
    topic: 'submission.notification.score',
})

/**
 * Create data for av rescan bus event
 * @param payload av rescan payload
 * @returns data for bus event
 */
export const CREATE_BUS_EVENT_AV_RESCAN = (
    payload: RequestBusAPIAVScanPayload,
): RequestBusAPIAVScan => ({
    'mime-type': 'application/json',
    originator: 'submission-processor',
    payload,
    timestamp: new Date()
        .toISOString(),
    topic: 'avscan.action.scan',
})
