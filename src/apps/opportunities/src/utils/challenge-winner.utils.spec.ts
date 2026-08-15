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

    it('prefers a matching public latest-submission final score', () => {
        expect(winnerFinalScore(
            { handle: 'Winner', placement: 1, userId: '42' },
            [{ finalScore: 98.98, id: 'submission', memberId: '42' }],
            [{ aggregateScore: 88, isFinal: true, submitterId: '42' }],
        ))
            .toBe(98.98)
    })

    it('falls back to a case-insensitive Review Summation match', () => {
        expect(winnerFinalScore(
            { handle: 'Winner', placement: 2 },
            [],
            [{
                aggregateScore: '98.88',
                isFinal: true,
                submitterHandle: 'winner',
            }],
        ))
            .toBe(98.88)
    })

    it('matches legacy submission placements and leaves missing scores empty', () => {
        expect(winnerFinalScore(
            { placement: 4 },
            [{ finalScore: 75.5, id: 'submission', placement: 4 }],
            [],
        ))
            .toBe(75.5)
        expect(winnerFinalScore({ handle: 'nobody' }, [], []))
            .toBeUndefined()
    })
})
