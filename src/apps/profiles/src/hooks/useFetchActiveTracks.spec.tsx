import type { MemberStats, UserStats, UserStatsHistory } from '~/libs/core'

import {
    getActiveTracks,
    getMemberChallengePoints,
    getSubTrackDisplaySubmissionCount,
    getSubTrackSummaryStats,
    getTrackSummaryStats,
    MemberStatsTrack,
    SubTrackSummaryStats,
} from './useFetchActiveTracks'

jest.mock('~/libs/core', () => ({
    useMemberStats: jest.fn(),
    useStatsHistory: jest.fn(),
}), {
    virtual: true,
})

describe('getActiveTracks', () => {
    it('keeps unified design and development subtracks visible', () => {
        const activeTracks: MemberStatsTrack[] = getActiveTracks({
            DATA_SCIENCE: {
                MARATHON_MATCH: {
                    challenges: 4,
                    rank: {
                        percentile: 20,
                        rating: 900,
                    },
                    wins: 4,
                },
            },
            DESIGN: {
                subTracks: [
                    {
                        challenges: 20,
                        name: 'Challenge',
                        wins: 16,
                    },
                ],
            },
            DEVELOP: {
                subTracks: [
                    {
                        challenges: 24,
                        name: 'Challenge',
                        submissions: {
                            submissions: 24,
                        },
                        wins: 23,
                    },
                    {
                        challenges: 2,
                        name: 'Task',
                        submissions: {
                            submissions: 2,
                        },
                        wins: 2,
                    },
                ],
            },
        } as UserStats)
        const trackNames: string[] = activeTracks.map(track => track.name)
        const designTrackNames: string[] | undefined = activeTracks
            .find(track => track.name === 'Design')
            ?.subTracks
            .map(track => track.name)
        const developmentTrackNames: string[] | undefined = activeTracks
            .find(track => track.name === 'Development')
            ?.subTracks
            .map(track => track.name)

        expect(trackNames)
            .toEqual(expect.arrayContaining([
                'Design',
                'Development',
                'Data Science',
            ]))
        expect(trackNames).not.toContain('Testing')
        expect(designTrackNames)
            .toEqual(['Challenge'])
        expect(developmentTrackNames)
            .toEqual(['Challenge', 'Task'])
    })

    it('includes Data Science Challenge stats in the Data Science track', () => {
        const activeTracks: MemberStatsTrack[] = getActiveTracks({
            DATA_SCIENCE: {
                Challenge: {
                    challenges: 1,
                    rank: {
                        percentile: 10,
                        rating: 1499,
                    },
                    submissions: {
                        submissions: 0,
                    },
                    wins: 1,
                },
                MARATHON_MATCH: {
                    challenges: 1,
                    rank: {
                        percentile: 20,
                        rating: 763,
                    },
                    wins: 0,
                },
            },
        } as UserStats)
        const dataScienceTrack: MemberStatsTrack | undefined = activeTracks
            .find(track => track.name === 'Data Science')
        const developmentTrack: MemberStatsTrack | undefined = activeTracks
            .find(track => track.name === 'Development')
        const challengeSubTrack = dataScienceTrack?.subTracks
            .find(track => track.name === 'Challenge')

        expect(dataScienceTrack?.challenges)
            .toEqual(2)
        expect(dataScienceTrack?.wins)
            .toEqual(1)
        expect(dataScienceTrack?.rating)
            .toEqual(1499)
        expect(dataScienceTrack?.percentile)
            .toEqual(10)
        expect(dataScienceTrack?.subTracks.map(track => track.name))
            .toEqual(['Challenge', 'MARATHON_MATCH'])
        expect(challengeSubTrack)
            .toEqual(expect.objectContaining({
                name: 'Challenge',
                parentTrack: 'DATA_SCIENCE',
                path: 'DATA_SCIENCE',
            }))
        expect(developmentTrack)
            .toBeUndefined()
    })

    it('keeps legacy testing subtracks in the testing track', () => {
        const activeTracks: MemberStatsTrack[] = getActiveTracks({
            DEVELOP: {
                subTracks: [
                    {
                        challenges: 10,
                        name: 'DEVELOPMENT',
                        submissions: {
                            submissions: 10,
                        },
                        wins: 3,
                    },
                    {
                        challenges: 5,
                        name: 'BUG_HUNT',
                        submissions: {
                            submissions: 5,
                        },
                        wins: 1,
                    },
                ],
            },
        } as UserStats)
        const developmentTrackNames: string[] | undefined = activeTracks
            .find(track => track.name === 'Development')
            ?.subTracks
            .map(track => track.name)
        const testingTrackNames: string[] | undefined = activeTracks
            .find(track => track.name === 'Testing')
            ?.subTracks
            .map(track => track.name)

        expect(developmentTrackNames)
            .toEqual(['DEVELOPMENT'])
        expect(testingTrackNames)
            .toEqual(['BUG_HUNT'])
    })

    it('shows QA Challenge stats in the testing track', () => {
        const activeTracks: MemberStatsTrack[] = getActiveTracks({
            QA: {
                challenges: 1,
                mostRecentEventDate: 1781237773026,
                mostRecentSubmission: 1781237773026,
                subTracks: [
                    {
                        challenges: 1,
                        name: 'Challenge',
                        rank: {
                            rating: 1490,
                        },
                        submissions: {
                            submissions: 1,
                        },
                        wins: 1,
                    },
                ],
                wins: 1,
            },
        } as UserStats)
        const testingTrack: MemberStatsTrack | undefined = activeTracks
            .find(track => track.name === 'Testing')
        const qaChallengeSubTrack = testingTrack?.subTracks
            .find(track => track.name === 'Challenge')

        expect(testingTrack)
            .toEqual(expect.objectContaining({
                challenges: 1,
                wins: 1,
            }))
        expect(qaChallengeSubTrack)
            .toEqual(expect.objectContaining({
                name: 'Challenge',
                parentTrack: 'QA',
                path: 'QA.subTracks',
            }))
        expect(qaChallengeSubTrack?.rank?.rating)
            .toEqual(1490)
    })

    it('shows top-level AI engineering stats under the Development track', () => {
        const memberStats = {
            AI_ENGINEERING: {
                challenges: 14,
                rank: {
                    overallPercentile: 15,
                    rating: 101,
                },
                submissions: {
                    submissions: 100,
                },
            },
            challengePoints: 2847,
        } as UserStats
        const activeTracks: MemberStatsTrack[] = getActiveTracks(memberStats)
        const developmentTrack: MemberStatsTrack | undefined = activeTracks
            .find(track => track.name === 'Development')
        const aiSubTrack = developmentTrack?.subTracks
            .find(track => track.name === 'AI Engineering')

        expect(developmentTrack)
            .toEqual(expect.objectContaining({
                challenges: 14,
                isActive: true,
                submissions: 100,
            }))
        expect(aiSubTrack)
            .toEqual(expect.objectContaining({
                challenges: 14,
                name: 'AI Engineering',
                parentTrack: 'AI_ENGINEERING',
                path: 'AI_ENGINEERING',
                rank: expect.objectContaining({
                    overallPercentile: 15,
                    rating: 101,
                }),
                submissions: {
                    submissions: 100,
                },
            }))
        expect(activeTracks.map(track => track.name))
            .not.toContain('AI Engineering')
        expect(getMemberChallengePoints(memberStats))
            .toBe(2847)
    })

    it('shows Data Science AI rating paths under Development while keeping original Data Science Challenge', () => {
        const activeTracks: MemberStatsTrack[] = getActiveTracks({
            challenges: 6,
            DATA_SCIENCE: {
                'AI Engineering': {
                    challenges: 3,
                    rank: {
                        overallPercentile: 12,
                        rating: 1422,
                    },
                    wins: 1,
                },
                Challenge: {
                    challenges: 3,
                    rank: {
                        percentile: 18,
                        rating: 1380,
                    },
                    wins: 1,
                },
            },
            groupId: 1,
            handle: 'winterflame',
            handleLower: 'winterflame',
            userId: 15391415,
            wins: 2,
        } as unknown as UserStats)
        const developmentTrack: MemberStatsTrack | undefined = activeTracks
            .find(track => track.name === 'Development')
        const dataScienceTrack: MemberStatsTrack | undefined = activeTracks
            .find(track => track.name === 'Data Science')
        const aiSubTrack = developmentTrack?.subTracks
            .find(track => track.name === 'AI Engineering')
        const challengeSubTrack = dataScienceTrack?.subTracks
            .find(track => track.name === 'Challenge')

        expect(developmentTrack)
            .toEqual(expect.objectContaining({
                challenges: 3,
                isActive: true,
                submissions: 3,
                wins: 1,
            }))
        expect(aiSubTrack)
            .toEqual(expect.objectContaining({
                challenges: 3,
                name: 'AI Engineering',
                parentTrack: 'DATA_SCIENCE',
                path: 'DATA_SCIENCE',
                rank: expect.objectContaining({
                    overallPercentile: 12,
                    rating: 1422,
                }),
                wins: 1,
            }))
        expect(getSubTrackDisplaySubmissionCount(aiSubTrack))
            .toEqual(3)
        expect(dataScienceTrack)
            .toEqual(expect.objectContaining({
                challenges: 3,
                isActive: true,
                rating: 1380,
                wins: 1,
            }))
        expect(challengeSubTrack)
            .toEqual(expect.objectContaining({
                name: 'Challenge',
                parentTrack: 'DATA_SCIENCE',
                path: 'DATA_SCIENCE',
            }))
        expect(activeTracks.map(track => track.name))
            .not.toContain('AI Engineering')
    })

    it('deduplicates Development totals when AI Engineering and Challenge share challenge history', () => {
        const sharedChallengeHistory = [
            {
                challengeId: 'sales-app-dev-ai-expo',
                challengeName: 'Sales App dev AI expo',
                newRating: 1200,
                placement: 1,
                ratingDate: 1781237773026,
            },
            {
                challengeId: 'sales-app-dev-ai',
                challengeName: 'Sales App dev AI',
                newRating: 1200,
                placement: 1,
                ratingDate: 1781237773027,
            },
        ]
        const statsHistory = {
            DATA_SCIENCE: {
                'AI Engineering': {
                    history: [
                        {
                            challengeId: 'dev-mm-with-ai',
                            challengeName: 'Dev MM with AI',
                            newRating: 1200,
                            placement: 1,
                            ratingDate: 1781237773021,
                        },
                        {
                            challengeId: 'ds-mm-with-ai-exponential-league',
                            challengeName: 'DS MM with AI Exponential League',
                            newRating: 1200,
                            placement: 1,
                            ratingDate: 1781237773022,
                        },
                        {
                            challengeId: 'ds-with-ai-exponential-league',
                            challengeName: 'DS with AI Exponential League',
                            newRating: 1200,
                            placement: 1,
                            ratingDate: 1781237773023,
                        },
                        {
                            challengeId: 'sales-app-ds-ai',
                            challengeName: 'Sales App DS AI',
                            newRating: 1200,
                            placement: 1,
                            ratingDate: 1781237773024,
                        },
                        ...sharedChallengeHistory,
                    ],
                },
            },
            DEVELOP: {
                subTracks: [
                    {
                        history: sharedChallengeHistory,
                        name: 'Challenge',
                    },
                ],
            },
        } as unknown as UserStatsHistory
        const activeTracks: MemberStatsTrack[] = getActiveTracks({
            DATA_SCIENCE: {
                'AI Engineering': {
                    challenges: 6,
                    rank: {
                        rating: 1200,
                    },
                    submissions: {
                        submissions: 6,
                    },
                    wins: 6,
                },
            },
            DEVELOP: {
                subTracks: [
                    {
                        challenges: 2,
                        name: 'Challenge',
                        submissions: {
                            submissions: 2,
                        },
                        wins: 2,
                    },
                ],
            },
        } as unknown as UserStats, statsHistory)
        const developmentTrack: MemberStatsTrack | undefined = activeTracks
            .find(track => track.name === 'Development')

        expect(developmentTrack)
            .toEqual(expect.objectContaining({
                challenges: 6,
                submissions: 6,
                wins: 6,
            }))
        expect(developmentTrack?.subTracks.map(track => track.name))
            .toEqual(['Challenge', 'AI Engineering'])
    })

    it('keeps rated custom non-AI data science paths visible as member stats tracks', () => {
        const activeTracks: MemberStatsTrack[] = getActiveTracks({
            challenges: 5,
            DATA_SCIENCE: {
                'Java MySQL': {
                    challenges: 3,
                    rank: {
                        overallPercentile: 12,
                        rating: 1422,
                    },
                    wins: 1,
                },
                NO_RATING: {
                    challenges: 2,
                    rank: {},
                    wins: 1,
                },
            },
            groupId: 1,
            handle: 'winterflame',
            handleLower: 'winterflame',
            userId: 15391415,
            wins: 2,
        } as unknown as UserStats)
        const javaMySQLTrack: MemberStatsTrack | undefined = activeTracks.find(track => track.name === 'Java MySQL')

        expect(javaMySQLTrack)
            .toEqual(expect.objectContaining({
                challenges: 3,
                isActive: true,
                isDSTrack: true,
                percentile: 12,
                rating: 1422,
                submissions: 3,
                wins: 1,
            }))
        expect(javaMySQLTrack?.subTracks)
            .toEqual([
                expect.objectContaining({
                    name: 'Java MySQL',
                    parentTrack: 'DATA_SCIENCE',
                    path: 'DATA_SCIENCE',
                }),
            ])
        expect(activeTracks.map(track => track.name))
            .not.toContain('NO_RATING')
    })
})

describe('getSubTrackSummaryStats', () => {
    it('falls back to challenge count when a subtrack has zero submissions', () => {
        const summaryStats = getSubTrackSummaryStats({
            challenges: 3,
            submissions: {
                submissions: 0,
            },
            wins: 3,
        } as MemberStats)

        expect(summaryStats)
            .toEqual({
                submissions: 3,
                wins: 3,
            })
    })

    it('falls back to history placements for AI Engineering wins and submissions', () => {
        const summaryStats = getSubTrackSummaryStats({
            challenges: 6,
            name: 'AI Engineering',
            submissions: {
                submissions: 0,
            },
            wins: 0,
        } as MemberStats, [
            {
                challengeId: 'ai-1',
                challengeName: 'AI Challenge 1',
                newRating: 840,
                placement: 1,
                ratingDate: 1781237773026,
            },
            {
                challengeId: 'ai-2',
                challengeName: 'AI Challenge 2',
                newRating: 860,
                placement: 2,
                ratingDate: 1781237773027,
            },
            {
                challengeId: 'ai-3',
                challengeName: 'AI Challenge 3',
                newRating: 901,
                placement: 1,
                ratingDate: 1781237773028,
            },
        ])

        expect(summaryStats)
            .toEqual({
                submissions: 6,
                wins: 2,
            })
    })

    it('uses placement history when aggregate wins are stale and nonzero', () => {
        const summaryStats = getSubTrackSummaryStats({
            challenges: 5,
            name: 'AI Engineering',
            submissions: {
                submissions: 5,
            },
            wins: 2,
        } as MemberStats, [
            {
                challengeId: 'ai-1',
                challengeName: 'AI Challenge 1',
                newRating: 840,
                placement: 2,
                ratingDate: 1781237773026,
            },
            {
                challengeId: 'ai-2',
                challengeName: 'AI Challenge 2',
                newRating: 860,
                placement: 5,
                ratingDate: 1781237773027,
            },
        ])

        expect(summaryStats)
            .toEqual({
                submissions: 5,
                wins: 0,
            })
    })

    it('keeps aggregate wins when history rows have no placement data', () => {
        const summaryStats = getSubTrackSummaryStats({
            challenges: 2,
            name: 'Challenge',
            submissions: {
                submissions: 2,
            },
            wins: 2,
        } as MemberStats, [
            {
                challengeId: 'dev-1',
                challengeName: 'Development Challenge 1',
                newRating: 840,
                ratingDate: 1781237773026,
            },
        ])

        expect(summaryStats)
            .toEqual({
                submissions: 2,
                wins: 2,
            })
    })
})

describe('getTrackSummaryStats', () => {
    const statsOnlyHistoryStats = {
        DEVELOP: {
            subTracks: [
                {
                    challenges: 231,
                    name: 'Task',
                    submissions: {
                        submissions: 231,
                    },
                    wins: 231,
                },
                {
                    challenges: 18,
                    name: 'Challenge',
                    submissions: {
                        submissions: 18,
                    },
                    wins: 17,
                },
                {
                    challenges: 21,
                    name: 'CONTENT_CREATION',
                    submissions: {
                        submissions: 17,
                    },
                    wins: 8,
                },
                {
                    challenges: 71,
                    name: 'First2Finish',
                    submissions: {
                        submissions: 66,
                    },
                    wins: 64,
                },
                {
                    challenges: 37,
                    name: 'CODE',
                    submissions: {
                        submissions: 24,
                    },
                    wins: 10,
                },
            ],
        },
    } as unknown as UserStats
    const statsOnlyHistory = {
        DEVELOP: {
            subTracks: [
                {
                    history: [
                        {
                            challengeId: 'task-1',
                            challengeName: 'Task 1',
                            placement: 1,
                            ratingDate: 1781237773026,
                        },
                        {
                            challengeId: 'task-2',
                            challengeName: 'Task 2',
                            placement: 1,
                            ratingDate: 1781237773027,
                        },
                    ],
                    name: 'Task',
                },
                {
                    history: [
                        {
                            challengeId: 'challenge-1',
                            challengeName: 'Challenge 1',
                            placement: 1,
                            ratingDate: 1781237773028,
                        },
                        {
                            challengeId: 'challenge-2',
                            challengeName: 'Challenge 2',
                            placement: 36,
                            ratingDate: 1781237773029,
                        },
                    ],
                    name: 'Challenge',
                },
                {
                    history: [
                        {
                            challengeId: 30040681,
                            newRating: 1333,
                            ratingDate: 1393405500000,
                        },
                    ],
                    name: 'CONTENT_CREATION',
                },
            ],
        },
    } as unknown as UserStatsHistory

    it('adds aggregate wins for subtracks whose history has no placements', () => {
        const developmentTrack: MemberStatsTrack | undefined = getActiveTracks(
            statsOnlyHistoryStats,
            statsOnlyHistory,
        )
            .find(track => track.name === 'Development')
        const subTrackWins: number = developmentTrack?.subTracks.reduce((wins, subTrack) => {
            const trackHistory = statsOnlyHistory.DEVELOP?.subTracks
                ?.find(historyEntry => historyEntry.name === subTrack.name)
                ?.history ?? []
            const summaryStats: SubTrackSummaryStats = getSubTrackSummaryStats(subTrack, trackHistory)

            return wins + summaryStats.wins
        }, 0) ?? 0

        // 2 Task placements + 1 Challenge placement + 8 CONTENT_CREATION + 64 First2Finish + 10 CODE
        expect(developmentTrack?.wins)
            .toEqual(85)
        expect(developmentTrack?.wins)
            .toEqual(subTrackWins)
    })

    it('keeps aggregate wins when no subtrack history has placements', () => {
        const summaryStats = getTrackSummaryStats(
            [
                {
                    challenges: 21,
                    name: 'CONTENT_CREATION',
                    path: 'DEVELOP.subTracks',
                    submissions: {
                        submissions: 17,
                    },
                    wins: 8,
                } as unknown as MemberStats,
            ],
            statsOnlyHistory,
        )

        expect(summaryStats.wins)
            .toEqual(8)
    })
})
