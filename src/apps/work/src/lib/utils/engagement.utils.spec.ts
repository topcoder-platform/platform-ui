import {
    ENGAGEMENT_STATUSES,
} from '../constants'

import {
    formatEngagementStatus,
    fromEngagementStatusApi,
    toEngagementStatusApi,
} from './engagement.utils'

jest.mock('~/config', () => ({
    EnvironmentConfig: new Proxy({}, {
        get: (): string => 'https://www.topcoder-dev.com',
    }),
}), { virtual: true })

describe('engagement.utils status mappings', () => {
    it('exposes On Hold in the work app status list', () => {
        expect(ENGAGEMENT_STATUSES)
            .toContain('On Hold')
        expect(ENGAGEMENT_STATUSES)
            .not.toContain('Pending Assignment')
    })

    it('maps the On Hold filter label to the backend status', () => {
        expect(toEngagementStatusApi('On Hold'))
            .toBe('ON_HOLD')
    })

    it('keeps legacy Pending Assignment inputs compatible with the backend', () => {
        expect(toEngagementStatusApi('Pending Assignment'))
            .toBe('ON_HOLD')
    })

    it('formats ON_HOLD and legacy pending assignment API values as On Hold', () => {
        expect(fromEngagementStatusApi('ON_HOLD'))
            .toBe('On Hold')
        expect(fromEngagementStatusApi('PENDING_ASSIGNMENT'))
            .toBe('On Hold')
        expect(formatEngagementStatus('ON_HOLD'))
            .toBe('On Hold')
    })
})
