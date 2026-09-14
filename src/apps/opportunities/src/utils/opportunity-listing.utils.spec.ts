import {
    defaultSort,
    normalizeOpportunitySort,
    opportunitySortOptions,
    sortOpportunityItems,
} from './opportunity-listing.utils'

describe('opportunity listing sorting', () => {
    it('uses the clarified four shared sort choices', () => {
        expect(defaultSort())
            .toBe('newest')
        expect(opportunitySortOptions())
            .toEqual([
                { label: 'Newest first', value: 'newest' },
                { label: 'Prize high to low', value: 'prizeHighToLow' },
                { label: 'Prize low to high', value: 'prizeLowToHigh' },
                { label: 'Title A-Z', value: 'titleAZ' },
            ])
    })

    it('uses the same product vocabulary on non-Review listings', () => {
        expect(opportunitySortOptions())
            .toEqual([
                { label: 'Newest first', value: 'newest' },
                { label: 'Prize high to low', value: 'prizeHighToLow' },
                { label: 'Prize low to high', value: 'prizeLowToHigh' },
                { label: 'Title A-Z', value: 'titleAZ' },
            ])
    })

    it('normalizes retired sort values to Newest first', () => {
        expect(opportunitySortOptions())
            .toEqual([
                { label: 'Newest first', value: 'newest' },
                { label: 'Prize high to low', value: 'prizeHighToLow' },
                { label: 'Prize low to high', value: 'prizeLowToHigh' },
                { label: 'Title A-Z', value: 'titleAZ' },
            ])
        expect(normalizeOpportunitySort('startingSoon'))
            .toBe('newest')
        expect(opportunitySortOptions())
            .toEqual([
                { label: 'Newest first', value: 'newest' },
                { label: 'Prize high to low', value: 'prizeHighToLow' },
                { label: 'Prize low to high', value: 'prizeLowToHigh' },
                { label: 'Title A-Z', value: 'titleAZ' },
            ])
    })

    it('sorts the visible owner page by numeric prize and title', () => {
        const items = [
            { id: 'b', name: 'Zulu', overview: { totalPrizes: 100 } },
            { id: 'a', name: 'alpha', overview: { totalPrizes: 500 } },
            { id: 'missing', name: 'No amount yet' },
        ]

        expect(sortOpportunityItems(items, 'prizeHighToLow')
            .map(item => item.id))
            .toEqual(['a', 'b', 'missing'])
        expect(sortOpportunityItems(items, 'prizeLowToHigh')
            .map(item => item.id))
            .toEqual(['b', 'a', 'missing'])
        expect(sortOpportunityItems(items, 'titleAZ')
            .map(item => item.id))
            .toEqual(['a', 'missing', 'b'])
    })

    it('does not sort standard Copilot rates by a stale custom-payment value', () => {
        const items = [
            {
                id: 'custom-600',
                otherPaymentType: '$600',
                paymentType: 'other',
            },
            {
                id: 'standard-with-stale-600',
                otherPaymentType: '$600',
                paymentType: 'standard',
            },
            {
                id: 'custom-400',
                otherPaymentType: '$400',
                paymentType: 'other',
            },
        ]

        expect(sortOpportunityItems(items, 'prizeHighToLow')
            .map(item => item.id))
            .toEqual(['custom-600', 'custom-400', 'standard-with-stale-600'])
        expect(sortOpportunityItems(items, 'prizeLowToHigh')
            .map(item => item.id))
            .toEqual(['custom-400', 'custom-600', 'standard-with-stale-600'])
    })
})
