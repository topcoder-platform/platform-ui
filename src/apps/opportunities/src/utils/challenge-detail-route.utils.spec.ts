import {
    challengeDetailPath,
    challengeDetailTabFromSearch,
    challengeForumLink,
    challengeForumLinkTargetFromSearch,
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

    it('builds shareable forum topic and message links from the current challenge page', () => {
        const pageUrl = 'https://www.topcoder-dev.com/opportunities/challenge/challenge-id'
        expect(challengeForumLink(`${pageUrl}?source=listing&tab=registrants#challenge`, 'topic-1'))
            .toBe(`${pageUrl}?tab=forum&topicId=topic-1`)
        expect(challengeForumLink('https://topgear.example/challenge/challenge-id', 'topic-1', 'post-2'))
            .toBe('https://topgear.example/challenge/challenge-id?tab=forum&topicId=topic-1&postId=post-2')
    })

    it('reads a shared forum topic and post, ignoring blank values and posts without a topic', () => {
        expect(challengeForumLinkTargetFromSearch(new URLSearchParams('tab=forum&topicId=topic-1&postId=post-2')))
            .toEqual({ postId: 'post-2', topicId: 'topic-1' })
        expect(challengeForumLinkTargetFromSearch(
            new URLSearchParams('tab=forum&topicId=%20topic-1%20&postId=%20'),
        ))
            .toEqual({ postId: undefined, topicId: 'topic-1' })
        expect(challengeForumLinkTargetFromSearch(new URLSearchParams('tab=forum&postId=post-2')))
            .toEqual({ postId: undefined, topicId: undefined })
    })
})
