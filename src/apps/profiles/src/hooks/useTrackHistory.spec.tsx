import type { MemberStats, UserStatsHistory } from '~/libs/core'

import { getTrackHistoryFromStats } from './useTrackHistory'

jest.mock('~/libs/core', () => ({
    useStatsHistory: jest.fn(),
}), {
    virtual: true,
})

describe('getTrackHistoryFromStats', () => {
    it('reads compatibility history paths for displayed subtracks', () => {
        const trackData = {
            historyPaths: ['DATA_SCIENCE.Challenge.history'],
            name: 'CODE',
            parentTrack: 'DEVELOP',
            path: 'DEVELOP.subTracks',
        } as MemberStats
        const history = getTrackHistoryFromStats({
            DATA_SCIENCE: {
                Challenge: {
                    history: [
                        {
                            challengeId: 'ds-challenge',
                            challengeName: 'Data Science Challenge',
                            newRating: 1499,
                            ratingDate: 1781237773026,
                        },
                    ],
                },
            },
            DEVELOP: {
                subTracks: [],
            },
            groupId: 10,
            handle: 'testcoun',
            handleLower: 'testcoun',
            userId: 89770325,
        } as UserStatsHistory, trackData)

        expect(history)
            .toEqual([
                expect.objectContaining({
                    challengeId: 'ds-challenge',
                    newRating: 1499,
                }),
            ])
    })
})
