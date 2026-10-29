import { EngagementLeadStatus, EngagementLeadType } from '../models/EngagementLead.model'

import {
    getLeadDisplayStatus,
    getLeadTypeFromTabParam,
    getLeadTypeTabParam,
} from './engagement-leads.utils'

describe('getLeadDisplayStatus', () => {
    it.each([
        [EngagementLeadStatus.SUBMITTED, 'New'],
        [EngagementLeadStatus.UNDER_REVIEW, 'In Progress'],
        [EngagementLeadStatus.QUALIFIED, 'In Progress'],
        [EngagementLeadStatus.CONVERTED, 'Converted'],
        [EngagementLeadStatus.REJECTED, 'Declined'],
    ])('shows %s leads as %s', (status, displayStatus) => {
        expect(getLeadDisplayStatus(status))
            .toBe(displayStatus)
    })
})

describe('lead type tab param', () => {
    it('round-trips both lead types', () => {
        expect(getLeadTypeFromTabParam(getLeadTypeTabParam(EngagementLeadType.WIPRO_DIRECT)))
            .toBe(EngagementLeadType.WIPRO_DIRECT)
        expect(getLeadTypeFromTabParam(getLeadTypeTabParam(EngagementLeadType.WIPRO_CONSUMPTION)))
            .toBe(EngagementLeadType.WIPRO_CONSUMPTION)
    })

    it('falls back to the Wipro Consumption tab', () => {
        expect(getLeadTypeFromTabParam(undefined))
            .toBe(EngagementLeadType.WIPRO_CONSUMPTION)
        expect(getLeadTypeFromTabParam('unknown'))
            .toBe(EngagementLeadType.WIPRO_CONSUMPTION)
    })
})
