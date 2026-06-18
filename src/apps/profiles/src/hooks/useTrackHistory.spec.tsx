import type { MemberStats, UserStatsHistory } from '~/libs/core'

import { getTrackHistoryFromStats } from './useTrackHistory'

jest.mock('~/libs/core', () => ({
    useStatsHistory: jest.fn(),
}), {
    virtual: true,
})

describe('getTrackHistoryFromStats', () => {
    it('reads keyed Data Science Challenge history', () => {
        const trackData = {
            name: 'Challenge',
            parentTrack: 'DATA_SCIENCE',
            path: 'DATA_SCIENCE',
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

    it('reads QA subtrack history paths', () => {
        const trackData = {
            name: 'Challenge',
            parentTrack: 'QA',
            path: 'QA.subTracks',
        } as MemberStats
        const history = getTrackHistoryFromStats({
            groupId: 10,
            handle: 'testmfa6',
            handleLower: 'testmfa6',
            QA: {
                subTracks: [
                    {
                        history: [
                            {
                                challengeId: 'qa-challenge',
                                challengeName: 'QA Challenge',
                                newRating: 1490,
                                ratingDate: 1781237773026,
                            },
                        ],
                        name: 'Challenge',
                    },
                ],
            },
            userId: 89770374,
        } as UserStatsHistory, trackData)

        expect(history)
            .toEqual([
                expect.objectContaining({
                    challengeId: 'qa-challenge',
                    newRating: 1490,
                }),
            ])
    })
})
