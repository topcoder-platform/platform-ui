import type { UserStats } from '~/libs/core'

import { getLatestProfileRating } from './MemberRatingCard.utils'

describe('getLatestProfileRating', () => {
    it('uses the newest rated track instead of the historical max rating', () => {
        expect(getLatestProfileRating({
            DATA_SCIENCE: {
                'AI Engineering': {
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
            .toBe(748)
    })

    it('uses configured data science rating paths when they are newest', () => {
        expect(getLatestProfileRating({
            DATA_SCIENCE: {
                AI: {
                    mostRecentEventDate: 2000,
                    rank: {
                        rating: 840,
                    },
                },
            },
            DEVELOP: {
                subTracks: [{
                    mostRecentEventDate: 1000,
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
        expect(getLatestProfileRating({
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
