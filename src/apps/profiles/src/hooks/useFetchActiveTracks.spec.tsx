import { renderHook } from '@testing-library/react'

import { useMemberStats } from '~/libs/core'

import { useFetchActiveTracks } from './useFetchActiveTracks'

jest.mock('~/libs/core', () => ({
    useMemberStats: jest.fn(),
}))

describe('useFetchActiveTracks', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('keeps unified design and development subtracks visible', () => {
        ;(useMemberStats as jest.Mock).mockReturnValue({
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
        })

        const { result } = renderHook(() => useFetchActiveTracks('taasintake800'))
        const trackNames = result.current.map(track => track.name)

        expect(trackNames).toEqual(expect.arrayContaining([
            'Design',
            'Development',
            'Data Science',
        ]))
        expect(trackNames).not.toContain('Testing')
        expect(result.current.find(track => track.name === 'Design')?.subTracks.map(track => track.name))
            .toEqual(['Challenge'])
        expect(result.current.find(track => track.name === 'Development')?.subTracks.map(track => track.name))
            .toEqual(['Challenge', 'Task'])
    })

    it('keeps legacy testing subtracks in the testing track', () => {
        ;(useMemberStats as jest.Mock).mockReturnValue({
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
        })

        const { result } = renderHook(() => useFetchActiveTracks('legacy-member'))

        expect(result.current.find(track => track.name === 'Development')?.subTracks.map(track => track.name))
            .toEqual(['DEVELOPMENT'])
        expect(result.current.find(track => track.name === 'Testing')?.subTracks.map(track => track.name))
            .toEqual(['BUG_HUNT'])
    })
})
