import {
    defaultSort,
    normalizeOpportunitySort,
    opportunitySortOptions,
} from './opportunity-listing.utils'

describe('opportunity listing sorting', () => {
    it('uses and displays Newest first as the Review default', () => {
        expect(defaultSort())
            .toBe('newest')
        expect(opportunitySortOptions('reviews'))
            .toEqual([
                { label: 'Newest first', value: 'newest' },
                { label: 'Starting soon', value: 'startingSoon' },
                { label: 'Highest payment', value: 'highestPayment' },
            ])
    })

    it('keeps the common sorts concise on non-Review listings', () => {
        expect(opportunitySortOptions('engagements'))
            .toEqual([
                { label: 'Newest first', value: 'newest' },
                { label: 'Starting soon', value: 'startingSoon' },
            ])
    })

    it('removes Starting soon and normalizes it for completed engagements only', () => {
        expect(opportunitySortOptions('engagements', 'CLOSED'))
            .toEqual([
                { label: 'Newest first', value: 'newest' },
            ])
        expect(normalizeOpportunitySort('engagements', 'CLOSED', 'startingSoon'))
            .toBe('newest')
        expect(opportunitySortOptions('reviews', 'CLOSED'))
            .toEqual([
                { label: 'Newest first', value: 'newest' },
                { label: 'Starting soon', value: 'startingSoon' },
                { label: 'Highest payment', value: 'highestPayment' },
            ])
    })
})
