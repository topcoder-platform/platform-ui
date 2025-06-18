/**
 * App config for bus event
 */
import { v4 as uuidv4 } from 'uuid'

import { RequestBusAPI } from '../lib/models'

/**
 * Create data for bus event
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
