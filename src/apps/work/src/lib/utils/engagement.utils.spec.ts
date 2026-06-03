import {
    ENGAGEMENT_STATUSES,
} from '../constants'

import {
    formatEngagementStatus,
    fromEngagementStatusApi,
    getCountableEngagementAssignments,
    getEngagementStatusPillVariant,
    normalizeEngagement,
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

    it('maps On Hold and legacy pending assignment statuses to the yellow pill variant', () => {
        expect(getEngagementStatusPillVariant('On Hold'))
            .toBe('yellow')
        expect(getEngagementStatusPillVariant('ON_HOLD'))
            .toBe('yellow')
        expect(getEngagementStatusPillVariant('Pending Assignment'))
            .toBe('yellow')
    })

    it('preserves assignment history while deriving assigned handles from active rows', () => {
        const normalized = normalizeEngagement({
            assignedMemberHandles: ['stale_member'],
            assignments: [
                {
                    id: 'assignment-active',
                    memberHandle: 'active_member',
                    status: 'ASSIGNED',
                },
                {
                    id: 'assignment-completed',
                    memberHandle: 'completed_member',
                    status: 'COMPLETED',
                },
                {
                    id: 'assignment-terminated',
                    memberHandle: 'terminated_member',
                    status: 'TERMINATED',
                },
            ],
            id: 'engagement-1',
        } as any)

        expect(normalized.assignments.map(assignment => assignment.memberHandle))
            .toEqual(['active_member', 'completed_member', 'terminated_member'])
        expect(normalized.assignedMemberHandles)
            .toEqual(['active_member'])
        expect(getCountableEngagementAssignments(normalized.assignments)
            .map(assignment => assignment.memberHandle))
            .toEqual(['active_member'])
    })
})
