import { UserStats } from '~/libs/core'

import {
    challengeTrackLabel,
    challengeTrackWins,
    winnerFinalScore,
} from './challenge-winner.utils'

describe('challenge winner utilities', () => {
    it('uses the requested track wins and falls back to the aggregate count', () => {
        const stats = {
            DEVELOP: { wins: 7 },
            wins: 12,
        } as UserStats

        expect(challengeTrackWins(stats, 'Development'))
            .toBe(7)
        expect(challengeTrackWins(stats, 'Copilot'))
            .toBe(12)
        expect(challengeTrackWins(undefined, 'Development'))
            .toBeUndefined()
        expect(challengeTrackLabel({ track: 'DATA_SCIENCE' }))
            .toBe('DATA_SCIENCE')
    })

    it('uses the canonical result matching both winner ID and placement', () => {
        expect(winnerFinalScore(
            { handle: 'Winner', placement: 1, userId: '42' },
            [
                { finalScore: 75, placement: 2, userId: '42' },
                { finalScore: '98.98', placement: 1, userId: 42 },
            ],
        ))
            .toBe(98.98)
    })

    it('does not infer a result from a handle or placement alone', () => {
        expect(winnerFinalScore(
            { handle: 'Winner', placement: 2 },
            [{ finalScore: 98.88, placement: 2, userId: '42' }],
        ))
            .toBeUndefined()
        expect(winnerFinalScore(
            { placement: 4, userId: '42' },
            [{ finalScore: 75.5, placement: 4, userId: '99' }],
        ))
            .toBeUndefined()
    })

    it('leaves missing and non-finite canonical scores empty', () => {
        expect(winnerFinalScore(
            { placement: 1, userId: '42' },
            [{ finalScore: 'not-a-score', placement: 1, userId: '42' }],
        ))
            .toBeUndefined()
        expect(winnerFinalScore({ handle: 'nobody' }, []))
            .toBeUndefined()
    })
})
