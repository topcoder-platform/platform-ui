import type { UserStats, UserStatsDistributionResponse } from '~/libs/core'

import {
    calculateTopPercentileFromDistribution,
    getRatingAudienceLabel,
    getRatingDistributionQuery,
} from './MemberRatingCard.utils'

describe('calculateTopPercentileFromDistribution', () => {
    const distribution: UserStatsDistributionResponse['distribution'] = {
        ratingRange0To899: 100,
        ratingRange900To1199: 200,
        ratingRange1200To1499: 300,
        ratingRange1500To2199: 400,
    }

    it('counts all members at or above the start of the matching rating range', () => {
        expect(calculateTopPercentileFromDistribution(distribution, 1500))
            .toBe(40)
    })

    it('interpolates the matching range based on the member rating', () => {
        expect(calculateTopPercentileFromDistribution(distribution, 1350))
            .toBeCloseTo(55)
    })

    it('returns undefined when the rating or distribution cannot be used', () => {
        expect(calculateTopPercentileFromDistribution(distribution, undefined))
            .toBeUndefined()
        expect(calculateTopPercentileFromDistribution({}, 1500))
            .toBeUndefined()
    })
})

describe('getRatingAudienceLabel', () => {
    it('maps top rating tracks to audience labels', () => {
        expect(getRatingAudienceLabel({
            maxRating: {
                rating: 1700,
                ratingColor: 'yellow',
                subTrack: 'Challenge',
                track: 'DESIGN',
            },
        } as UserStats))
            .toBe('Designers')
        expect(getRatingAudienceLabel({
            maxRating: {
                rating: 1700,
                ratingColor: 'yellow',
                subTrack: 'Challenge',
                track: 'DEVELOP',
            },
        } as UserStats))
            .toBe('Developers')
        expect(getRatingAudienceLabel({
            maxRating: {
                rating: 1700,
                ratingColor: 'yellow',
                subTrack: 'MARATHON_MATCH',
                track: 'DATA_SCIENCE',
            },
        } as UserStats))
            .toBe('Data Scientists')
        expect(getRatingAudienceLabel({
            maxRating: {
                rating: 1700,
                ratingColor: 'yellow',
                subTrack: 'Challenge',
                track: 'QA',
            },
        } as UserStats))
            .toBe('QA Professionals')
    })

    it('uses the QA label for legacy testing subtracks under development', () => {
        expect(getRatingAudienceLabel({
            maxRating: {
                rating: 1400,
                ratingColor: 'blue',
                subTrack: 'BUG_HUNT',
                track: 'DEVELOP',
            },
        } as UserStats))
            .toBe('QA Professionals')
    })
})

describe('getRatingDistributionQuery', () => {
    it('uses the highest rating track and subtrack for distribution lookup', () => {
        expect(getRatingDistributionQuery({
            maxRating: {
                rating: 1800,
                ratingColor: 'yellow',
                subTrack: 'Challenge',
                track: 'DEVELOP',
            },
        } as UserStats))
            .toEqual({
                subTrack: 'Challenge',
                track: 'DEVELOP',
            })
    })

    it('maps AI engineering ratings to the configured data science distribution', () => {
        expect(getRatingDistributionQuery({
            maxRating: {
                rating: 101,
                ratingColor: 'gray',
                subTrack: 'AI',
                track: 'AI_ENGINEERING',
            },
        } as UserStats))
            .toEqual({
                subTrack: 'AI',
                track: 'DATA_SCIENCE',
            })
    })
})
