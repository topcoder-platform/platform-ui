import { EngagementLeadStatus, EngagementLeadType } from '../models/EngagementLead.model'

import {
    getEngagementLeadsTabPath,
    getLeadDisplayStatus,
    getLeadTypeFromQueryValue,
    getLeadTypeQueryValue,
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

describe('lead type query value', () => {
    it('round-trips both lead types', () => {
        expect(getLeadTypeFromQueryValue(getLeadTypeQueryValue(EngagementLeadType.WIPRO_DIRECT)))
            .toBe(EngagementLeadType.WIPRO_DIRECT)
        expect(getLeadTypeFromQueryValue(getLeadTypeQueryValue(EngagementLeadType.WIPRO_CONSUMPTION)))
            .toBe(EngagementLeadType.WIPRO_CONSUMPTION)
    })

    it('falls back to the Wipro Consumption tab', () => {
        expect(getLeadTypeFromQueryValue(undefined))
            .toBe(EngagementLeadType.WIPRO_CONSUMPTION)
        expect(getLeadTypeFromQueryValue('unknown'))
            .toBe(EngagementLeadType.WIPRO_CONSUMPTION)
    })
})

describe('getEngagementLeadsTabPath', () => {
    it('opens the Leads tab of the Engagements page on the lead type tab', () => {
        expect(getEngagementLeadsTabPath(EngagementLeadType.WIPRO_DIRECT))
            .toBe('/engagements?tab=leads&leadType=wipro-direct')
        expect(getEngagementLeadsTabPath(undefined))
            .toBe('/engagements?tab=leads&leadType=wipro-consumption')
    })
})
