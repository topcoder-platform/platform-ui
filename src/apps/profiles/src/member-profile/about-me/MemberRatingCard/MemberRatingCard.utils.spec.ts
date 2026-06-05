import type { UserStats, UserStatsDistributionResponse } from '~/libs/core'

import {
    calculateTopPercentileFromDistribution,
    getPreferredRolesDisplay,
    getRatingAudienceLabel,
    getRatingDistributionQuery,
    parsePreferredRolesText,
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

describe('parsePreferredRolesText', () => {
    it('splits preferred roles on supported separators', () => {
        expect(parsePreferredRolesText('Designer\nFront-End Developer, Back-End Developer; Data Scientist'))
            .toEqual([
                'Designer',
                'Front-End Developer',
                'Back-End Developer',
                'Data Scientist',
            ])
    })

    it('keeps slash-separated role labels intact', () => {
        expect(parsePreferredRolesText('Cybersecurity Analyst / Security Engineer'))
            .toEqual(['Cybersecurity Analyst / Security Engineer'])
    })
})

describe('getPreferredRolesDisplay', () => {
    const preferredRoles = [
        'Designer',
        'Front-End Developer',
        'Back-End Developer',
        'Data Scientist',
    ]

    it('shows two roles and the hidden role count when collapsed', () => {
        expect(getPreferredRolesDisplay(preferredRoles, false))
            .toEqual({
                hiddenCount: 2,
                toggleLabel: '+ 2 more',
                visibleRoles: [
                    'Designer',
                    'Front-End Developer',
                ],
            })
    })

    it('shows all roles and a collapse label when expanded', () => {
        expect(getPreferredRolesDisplay(preferredRoles, true))
            .toEqual({
                hiddenCount: 0,
                toggleLabel: 'See less',
                visibleRoles: preferredRoles,
            })
    })

    it('omits the toggle when all roles fit in the compact list', () => {
        expect(getPreferredRolesDisplay(['Designer', 'Front-End Developer'], false))
            .toEqual({
                hiddenCount: 0,
                toggleLabel: undefined,
                visibleRoles: ['Designer', 'Front-End Developer'],
            })
    })
})
