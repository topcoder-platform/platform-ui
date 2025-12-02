/**
 * App config for bus event
 */
import { v4 as uuidv4 } from 'uuid'

import { EnvironmentConfig } from '~/config'

import {
    RequestBusAPI,
    RequestBusAPIAVScan,
    RequestBusAPIAVScanPayload,
    RequestBusAPIReprocess,
    SubmissionReprocessPayload,
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
    originator: 'review-api-v6',
    payload,
    timestamp: new Date()
        .toISOString(),
    topic: EnvironmentConfig.ADMIN.AVSCAN_TOPIC,
})

export const SUBMISSION_REPROCESS_TOPICS = {
    FIRST2FINISH: 'first2finish.submission.received',
    TOPGEAR_TASK: 'topgear.submission.received',
}

/**
 * Create data for submission reprocess bus event
 * @param topic kafka topic
 * @param payload submission data
 * @returns data for bus event
 */
export const CREATE_BUS_EVENT_REPROCESS_SUBMISSION = (
    topic: string,
    payload: SubmissionReprocessPayload,
): RequestBusAPIReprocess => ({
    'mime-type': 'application/json',
    originator: 'review-api-v6',
    payload,
    timestamp: new Date()
        .toISOString(),
    topic,
})
