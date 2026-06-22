import type { UserStats } from '~/libs/core'

import {
    getActiveTracks,
    getMemberChallengePoints,
    getSubTrackDisplaySubmissionCount,
    MemberStatsTrack,
} from './useFetchActiveTracks'

jest.mock('~/libs/core', () => ({
    useMemberStats: jest.fn(),
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
