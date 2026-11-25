/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrPostAsync,
    xhrPutAsync,
} from '~/libs/core'

import {
    createEngagementLeadCalculation,
    deleteEngagementLeadCalculation,
    fetchEngagementLeadCalculations,
    updateEngagementLeadCalculation,
} from './engagement-leads.service'

jest.mock('../constants', () => ({
    ENGAGEMENTS_ROOT_API_URL: 'https://example.com/v6/engagements',
}))
jest.mock('~/libs/core', () => ({
    xhrDeleteAsync: jest.fn(),
    xhrGetAsync: jest.fn(),
    xhrPatchAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
    xhrPutAsync: jest.fn(),
}), {
    virtual: true,
})

const LEADS_URL = 'https://example.com/v6/engagements/engagement-leads'

describe('engagement lead calculations', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('uses the lead\'s calculations when there is a lead', async () => {
        await fetchEngagementLeadCalculations('lead-1')
        await createEngagementLeadCalculation('lead-1', { referral: false })
        await updateEngagementLeadCalculation('lead-1', 'calc-1', { referral: true })
        await deleteEngagementLeadCalculation('lead-1', 'calc-1')

        expect(xhrGetAsync)
            .toHaveBeenCalledWith(`${LEADS_URL}/lead-1/calculations`)
        expect(xhrPostAsync)
            .toHaveBeenCalledWith(`${LEADS_URL}/lead-1/calculations`, { referral: false })
        expect(xhrPutAsync)
            .toHaveBeenCalledWith(`${LEADS_URL}/lead-1/calculations/calc-1`, { referral: true })
        expect(xhrDeleteAsync)
            .toHaveBeenCalledWith(`${LEADS_URL}/lead-1/calculations/calc-1`)
    })

    it('uses the user\'s general calculations without a lead', async () => {
        await fetchEngagementLeadCalculations(undefined)
        await createEngagementLeadCalculation(undefined, { referral: false })
        await updateEngagementLeadCalculation(undefined, 'calc-2', { referral: true })
        await deleteEngagementLeadCalculation(undefined, 'calc-2')

        expect(xhrGetAsync)
            .toHaveBeenCalledWith(`${LEADS_URL}/calculations`)
        expect(xhrPostAsync)
            .toHaveBeenCalledWith(`${LEADS_URL}/calculations`, { referral: false })
        expect(xhrPutAsync)
            .toHaveBeenCalledWith(`${LEADS_URL}/calculations/calc-2`, { referral: true })
        expect(xhrDeleteAsync)
            .toHaveBeenCalledWith(`${LEADS_URL}/calculations/calc-2`)
    })
})
