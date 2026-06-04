import type { UserStats } from '~/libs/core'

import { getActiveTracks, getMemberChallengePoints, MemberStatsTrack } from './useFetchActiveTracks'

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

    it('keeps AI engineering stats visible when the API returns them', () => {
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
        const aiTrack: MemberStatsTrack | undefined = activeTracks.find(track => track.name === 'AI Engineering')

        expect(aiTrack)
            .toEqual(expect.objectContaining({
                challenges: 14,
                isActive: true,
                percentile: 15,
                rating: 101,
                submissions: 100,
            }))
        expect(getMemberChallengePoints(memberStats))
            .toBe(2847)
    })
})
