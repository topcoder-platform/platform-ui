import {
    buildReviewContextSeed,
    findMemberReviewScorecardId,
    projectReviewContextScorecard,
} from './review-context-seed.utils'

describe('review-context-seed.utils', () => {
    const challenge = {
        description: '## Spec',
        descriptionFormat: 'markdown',
        discussions: [{ url: 'https://discussions.example/1' }],
        endDate: '2026-11-11T00:00:00.000Z',
        id: 'challenge-1',
        legacy: { reviewType: 'COMMUNITY' },
        name: 'Build the widget',
        numOfRegistrants: 7,
        numOfSubmissions: 2,
        overview: { totalPrizes: 1500 },
        prizeSets: [
            { prizes: [{ type: 'USD', value: 200 }], type: 'COPILOT' },
            { prizes: [{ type: 'USD', value: 1000 }, { type: 'USD', value: 500 }], type: 'PLACEMENT' },
        ],
        registrationEndDate: '2026-11-05T00:00:00.000Z',
        registrationStartDate: '2026-11-01T00:00:00.000Z',
        reviewers: [
            { aiWorkflowId: 'wf-1', isMemberReview: false, scorecardId: 'sc-ai' },
            { isMemberReview: true, scorecardId: 'sc-human', type: 'REGULAR' },
        ],
        skills: [{ category: { id: 'c' }, id: 'skill-1', name: 'TypeScript' }],
        startDate: '2026-11-01T00:00:00.000Z',
        status: 'Active',
        task: { isTask: false },
        track: { name: 'Development' },
        type: { name: 'Challenge' },
    }

    it('finds the member-review scorecard id', () => {
        expect(findMemberReviewScorecardId(challenge))
            .toBe('sc-human')
        expect(findMemberReviewScorecardId({ reviewers: [] }))
            .toBeUndefined()
    })

    it('maps challenge data to the unified context fields', () => {
        const scorecard = projectReviewContextScorecard({ id: 'sc-human', name: 'Dev', scorecardGroups: [] })

        expect(buildReviewContextSeed(challenge, scorecard))
            .toEqual({
                challenge_metadata: {
                    isTask: false,
                    numOfRegistrants: 7,
                    numOfSubmissions: 2,
                    status: 'Active',
                    totalPrizes: 1500,
                    track: 'Development',
                    type: 'Challenge',
                },
                challengeId: 'challenge-1',
                descriptionFormat: 'markdown',
                descriptionRaw: '## Spec',
                discussion_url: 'https://discussions.example/1',
                prizes: [
                    { currency: 'USD', placement: 1, value: 1000 },
                    { currency: 'USD', placement: 2, value: 500 },
                ],
                requirement_groups: [],
                requirements: [],
                review_criteria: {
                    reviewers: [
                        { aiWorkflowId: 'wf-1', isMemberReview: false, scorecardId: 'sc-ai', type: undefined },
                        { aiWorkflowId: undefined, isMemberReview: true, scorecardId: 'sc-human', type: 'REGULAR' },
                    ],
                    reviewType: 'COMMUNITY',
                    scorecard,
                },
                skills: [{ id: 'skill-1', name: 'TypeScript' }],
                tech_stack: [],
                timeline: {
                    endDate: '2026-11-11T00:00:00.000Z',
                    registrationEndDate: '2026-11-05T00:00:00.000Z',
                    registrationStartDate: '2026-11-01T00:00:00.000Z',
                    startDate: '2026-11-01T00:00:00.000Z',
                    totalDurationDays: 10,
                },
                title: 'Build the widget',
            })
    })

    it('uses safe defaults for a sparse challenge', () => {
        const seed = buildReviewContextSeed({ id: 'challenge-2' })

        expect(seed)
            .toMatchObject({
                descriptionFormat: 'markdown',
                prizes: [],
                review_criteria: { reviewers: [], reviewType: 'UNKNOWN' },
                timeline: { totalDurationDays: 0 },
            })
        expect(seed.review_criteria)
            .toHaveProperty('scorecard', null) // eslint-disable-line unicorn/no-null
        expect(seed)
            .not.toHaveProperty('discussion_url')
    })
})
