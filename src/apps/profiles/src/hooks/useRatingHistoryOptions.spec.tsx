import type { StatsHistory } from '~/libs/core'

import { getRatingHistoryData } from './useRatingHistoryOptions'

jest.mock('~/libs/core', () => ({
    getRatingColor: (rating: number): string => `rating-${rating}`,
    TC_RATING_COLORS: [{
        color: '#555555',
        limit: 900,
    }, {
        color: '#2D7E2D',
        limit: 1200,
    }, {
        color: '#616BD5',
        limit: 1500,
    }, {
        color: '#F2C900',
        limit: 2200,
    }, {
        color: '#EF3A3A',
        limit: Infinity,
    }],
}), {
    virtual: true,
})

describe('getRatingHistoryData', () => {
    it('sorts rated history points chronologically without mutating the source history', () => {
        const trackHistory: StatsHistory[] = [{
            challengeId: 'latest',
            challengeName: 'Latest rated challenge',
            date: 3000,
            newRating: 2100,
            rating: 2100,
            ratingDate: 3000,
        }, {
            challengeId: 'oldest',
            challengeName: 'Oldest rated challenge',
            newRating: 1500,
            ratingDate: 1000,
        }]
        const originalOrder: string[] = trackHistory.map(challenge => challenge.challengeId as string)

        expect(getRatingHistoryData(trackHistory))
            .toEqual([{
                color: 'rating-1500',
                name: 'Oldest rated challenge',
                x: 1000,
                y: 1500,
            }, {
                color: 'rating-2100',
                name: 'Latest rated challenge',
                x: 3000,
                y: 2100,
            }])
        expect(trackHistory.map(challenge => challenge.challengeId))
            .toEqual(originalOrder)
    })

    it('omits unrated history entries so Highcharts can draw a continuous rated line', () => {
        const trackHistory: StatsHistory[] = [{
            challengeId: 'rated-before',
            challengeName: 'Rated before',
            date: 1000,
            newRating: 1800,
            rating: 1800,
            ratingDate: 1000,
        }, {
            challengeId: 'unrated',
            challengeName: 'Unrated marathon match',
            date: 2000,
            newRating: undefined as unknown as number,
            ratingDate: 2000,
        }, {
            challengeId: 'rated-after',
            challengeName: 'Rated after',
            date: 3000,
            newRating: 2300,
            rating: 2300,
            ratingDate: 3000,
        }]

        expect(getRatingHistoryData(trackHistory))
            .toEqual([{
                color: 'rating-1800',
                name: 'Rated before',
                x: 1000,
                y: 1800,
            }, {
                color: 'rating-2300',
                name: 'Rated after',
                x: 3000,
                y: 2300,
            }])
    })
})
