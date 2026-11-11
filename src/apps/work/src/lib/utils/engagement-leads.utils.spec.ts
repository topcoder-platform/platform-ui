import { EngagementLeadStatus, EngagementLeadType } from '../models/EngagementLead.model'

import {
    canCreateEngagementFromLead,
    getEngagementLeadsTabPath,
    getLeadDisplayStatus,
    getLeadStatusTransitions,
    getLeadTypeFromQueryValue,
    getLeadTypeQueryValue,
} from './engagement-leads.utils'

describe('getLeadDisplayStatus', () => {
    it.each([
        [EngagementLeadStatus.SUBMITTED, 'New'],
        [EngagementLeadStatus.UNDER_REVIEW, 'Under Review'],
        [EngagementLeadStatus.QUALIFIED, 'Under Review'],
        [EngagementLeadStatus.CONVERTED, 'Under Review'],
        [EngagementLeadStatus.FULFILLED, 'Fulfilled'],
        [EngagementLeadStatus.REJECTED, 'Lost'],
    ])('shows %s leads as %s', (status, displayStatus) => {
        expect(getLeadDisplayStatus(status))
            .toBe(displayStatus)
    })
})

describe('getLeadStatusTransitions', () => {
    it.each([
        [EngagementLeadStatus.SUBMITTED, [
            EngagementLeadStatus.UNDER_REVIEW,
            EngagementLeadStatus.FULFILLED,
            EngagementLeadStatus.REJECTED,
        ]],
        [EngagementLeadStatus.REJECTED, [EngagementLeadStatus.UNDER_REVIEW, EngagementLeadStatus.FULFILLED]],
        [EngagementLeadStatus.UNDER_REVIEW, [EngagementLeadStatus.FULFILLED, EngagementLeadStatus.REJECTED]],
        [EngagementLeadStatus.CONVERTED, [EngagementLeadStatus.FULFILLED, EngagementLeadStatus.REJECTED]],
        [EngagementLeadStatus.FULFILLED, [EngagementLeadStatus.UNDER_REVIEW]],
    ])('lets a %s lead move to %p', (status, transitions) => {
        expect(getLeadStatusTransitions(status))
            .toEqual(transitions)
    })
})

describe('canCreateEngagementFromLead', () => {
    it.each([
        [EngagementLeadStatus.SUBMITTED, true],
        [EngagementLeadStatus.UNDER_REVIEW, true],
        [EngagementLeadStatus.FULFILLED, false],
        [EngagementLeadStatus.REJECTED, false],
    ])('allows it for a %s lead: %s', (status, expected) => {
        expect(canCreateEngagementFromLead({ status }))
            .toBe(expected)
    })

    it('does not allow a second engagement from the same lead', () => {
        expect(canCreateEngagementFromLead({
            convertedEngagementId: 'eng-1',
            status: EngagementLeadStatus.UNDER_REVIEW,
        }))
            .toBe(false)
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
