import type { UserStats, UserStatsDistributionResponse } from '~/libs/core'

import {
    calculateTopPercentileFromDistribution,
    formatTopPercentile,
    getCompactRatingColor,
    getPreferredRolesDisplay,
    getProfileRating,
    getRatingAudienceLabel,
    getRatingDistributionQuery,
    parsePreferredRolesText,
} from './MemberRatingCard.utils'

describe('getCompactRatingColor', () => {
    it('uses the lighter grey value for the lowest rating tier on the dark compact card', () => {
        expect(getCompactRatingColor(840, '#555555'))
            .toBe('#7F7F7F')
    })

    it('keeps the shared rating colors for higher rating tiers', () => {
        expect(getCompactRatingColor(900, '#2D7E2D'))
            .toBe('#2D7E2D')
        expect(getCompactRatingColor(1200, '#616BD5'))
            .toBe('#616BD5')
        expect(getCompactRatingColor(1500, '#F2C900'))
            .toBe('#F2C900')
        expect(getCompactRatingColor(2200, '#EF3A3A'))
            .toBe('#EF3A3A')
    })
})

describe('getProfileRating', () => {
    it('uses the highest rated track instead of the newest lower rating', () => {
        expect(getProfileRating({
            DATA_SCIENCE: {
                'AI Engineering': {
                    mostRecentEventDate: 1000,
                    rank: {
                        rating: 1200,
                    },
                },
                Challenge: {
                    mostRecentEventDate: 2000,
                    rank: {
                        rating: 732,
                    },
                },
            },
            maxRating: {
                rating: 1200,
                ratingColor: '#616BD5',
                subTrack: 'AI Engineering',
                track: 'DATA_SCIENCE',
            },
        } as unknown as UserStats))
            .toBe(1200)
    })

    it('uses configured data science rating paths when they are highest', () => {
        expect(getProfileRating({
            DATA_SCIENCE: {
                AI: {
                    mostRecentEventDate: 1000,
                    rank: {
                        rating: 840,
                    },
                },
            },
            DEVELOP: {
                subTracks: [{
                    mostRecentEventDate: 2000,
                    name: 'Challenge',
                    rank: {
                        rating: 748,
                    },
                }],
            },
            maxRating: {
                rating: 840,
                ratingColor: '#9D9FA0',
                subTrack: 'AI Engineering',
                track: 'DATA_SCIENCE',
            },
        } as unknown as UserStats))
            .toBe(840)
    })

    it('falls back to maxRating when no rated track entries are available', () => {
        expect(getProfileRating({
            DEVELOP: {
                subTracks: [{
                    mostRecentEventDate: 2000,
                    name: 'First2Finish',
                    rank: {},
                }],
            },
            maxRating: {
                rating: 1100,
                ratingColor: '#9D9FA0',
                subTrack: 'Challenge',
                track: 'DEVELOP',
            },
        } as unknown as UserStats))
            .toBe(1100)
    })
})

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

    it('returns the top known member percentage when the rating is above the highest range', () => {
        expect(calculateTopPercentileFromDistribution(distribution, 4051))
            .toBeCloseTo(0.1)
    })

    it('returns undefined when the rating or distribution cannot be used', () => {
        expect(calculateTopPercentileFromDistribution(distribution, undefined))
            .toBeUndefined()
        expect(calculateTopPercentileFromDistribution({}, 1500))
            .toBeUndefined()
    })
})

describe('formatTopPercentile', () => {
    it('shows top one percent for positive percentages that would round to zero', () => {
        expect(formatTopPercentile(0.4))
            .toBe('1')
    })

    it('keeps normal whole-number rounding for visible top percentages', () => {
        expect(formatTopPercentile(12.4))
            .toBe('12')
        expect(formatTopPercentile(12.5))
            .toBe('13')
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

    it('uses the highest rating track for the audience label', () => {
        expect(getRatingAudienceLabel({
            DATA_SCIENCE: {
                SRM: {
                    mostRecentEventDate: 1000,
                    rank: {
                        rating: 1400,
                    },
                },
            },
            DEVELOP: {
                subTracks: [{
                    mostRecentEventDate: 2000,
                    name: 'Challenge',
                    rank: {
                        rating: 1200,
                    },
                }],
            },
            maxRating: {
                rating: 1400,
                ratingColor: 'blue',
                subTrack: 'SRM',
                track: 'DATA_SCIENCE',
            },
        } as unknown as UserStats))
            .toBe('Data Scientists')
    })
})

describe('getRatingDistributionQuery', () => {
    it('uses the fallback max rating track and subtrack for distribution lookup', () => {
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

    it('uses the highest rating track and subtrack for distribution lookup', () => {
        expect(getRatingDistributionQuery({
            DATA_SCIENCE: {
                SRM: {
                    mostRecentEventDate: 1000,
                    rank: {
                        rating: 1400,
                    },
                },
            },
            DEVELOP: {
                subTracks: [{
                    mostRecentEventDate: 2000,
                    name: 'Challenge',
                    rank: {
                        rating: 1200,
                    },
                }],
            },
            maxRating: {
                rating: 1400,
                ratingColor: 'blue',
                subTrack: 'SRM',
                track: 'DATA_SCIENCE',
            },
        } as unknown as UserStats))
            .toEqual({
                subTrack: 'SRM',
                track: 'DATA_SCIENCE',
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
