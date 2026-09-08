import {
    challengeDetailPath,
    challengeDetailTabFromSearch,
} from './challenge-detail-route.utils'

describe('challenge detail routes', () => {
    it('builds encoded legacy-compatible tab deep links', () => {
        expect(challengeDetailPath('challenge / id'))
            .toBe('/opportunities/challenge/challenge%20%2F%20id')
        expect(challengeDetailPath('challenge / id', 'submissions'))
            .toBe('/opportunities/challenge/challenge%20%2F%20id?tab=submissions')
        expect(challengeDetailPath('challenge-id', 'registrants'))
            .toBe('/opportunities/challenge/challenge-id?tab=registrants')
        expect(challengeDetailPath('challenge-id', 'forum'))
            .toBe('/opportunities/challenge/challenge-id?tab=forum')
        expect(challengeDetailPath('challenge-id', 'winners'))
            .toBe('/opportunities/challenge/challenge-id?tab=winners')
    })

    it('accepts supported tab values case-insensitively and rejects unknown ones', () => {
        expect(challengeDetailTabFromSearch(new URLSearchParams('tab=%20WINNERS%20')))
            .toBe('winners')
        expect(challengeDetailTabFromSearch(new URLSearchParams('tab=challenge_forum')))
            .toBeUndefined()
        expect(challengeDetailTabFromSearch(new URLSearchParams('source=list')))
            .toBeUndefined()
    })
})
