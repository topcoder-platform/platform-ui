import {
    transformChallengeToFormData,
    transformFormDataToChallenge,
} from './challenge-editor.utils'

jest.mock('~/config', () => ({
    EnvironmentConfig: new Proxy({
        ADMIN: {
            REVIEW_UI_URL: 'https://review.topcoder-dev.com',
        },
        API: {
            V5: 'https://api.topcoder-dev.com/v5',
            V6: 'https://api.topcoder-dev.com/v6',
        },
    }, {
        get: (target, property: string): unknown => {
            if (property in target) {
                return (target as Record<string, unknown>)[property]
            }

            return 'https://www.topcoder-dev.com'
        },
    }),
}), { virtual: true })

describe('challenge-editor utils funChallenge mapping', () => {
    it('defaults funChallenge to false in form data', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'MM Fun Challenge',
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.funChallenge)
            .toBe(false)
    })

    it('keeps funChallenge true when converting challenge to form data', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            funChallenge: true,
            name: 'MM Fun Challenge',
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.funChallenge)
            .toBe(true)
    })

    it('serializes funChallenge to API payload', () => {
        const formData: Record<string, unknown> = {
            description: 'Public specification',
            funChallenge: true,
            name: 'MM Fun Challenge',
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        }

        const result = transformFormDataToChallenge(formData as any)

        expect(result.funChallenge)
            .toBe(true)
    })

    it('omits prizeSets from API payload for fun challenges', () => {
        const formData: Record<string, unknown> = {
            description: 'Public specification',
            funChallenge: true,
            name: 'MM Fun Challenge',
            prizeSets: [
                {
                    prizes: [
                        {
                            type: 'USD',
                            value: 500,
                        },
                    ],
                    type: 'placement',
                },
            ],
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        }

        const result = transformFormDataToChallenge(formData as any)

        expect(result)
            .not
            .toHaveProperty('prizeSets')
    })
})

describe('challenge-editor utils wiproAllowed mapping', () => {
    it('defaults wiproAllowed to false in form data', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'MM Wipro Challenge',
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.wiproAllowed)
            .toBe(false)
    })

    it('keeps wiproAllowed true when converting challenge to form data', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'MM Wipro Challenge',
            trackId: 'track-id',
            typeId: 'type-id',
            wiproAllowed: true,
        })

        expect(result.wiproAllowed)
            .toBe(true)
    })

    it('serializes wiproAllowed to API payload', () => {
        const formData: Record<string, unknown> = {
            description: 'Public specification',
            name: 'MM Wipro Challenge',
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
            wiproAllowed: true,
        }

        const result = transformFormDataToChallenge(formData as any)

        expect(result.wiproAllowed)
            .toBe(true)
    })
})

describe('challenge-editor utils creator mapping', () => {
    it('keeps the challenge creator handle in form data', () => {
        const result = transformChallengeToFormData({
            createdBy: ' challenge.creator ',
            description: 'Public specification',
            name: 'Creator Challenge',
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.createdBy)
            .toBe('challenge.creator')
    })
})

describe('challenge-editor utils billing markup mapping', () => {
    it('keeps billing markup when converting challenge to form data', () => {
        const result = transformChallengeToFormData({
            billing: {
                billingAccountId: 12345,
                markup: 0.58,
            },
            description: 'Public specification',
            name: 'Billing markup challenge',
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.billing)
            .toEqual({
                billingAccountId: 12345,
                markup: 0.58,
            })
    })

    it('serializes billing markup to API payload', () => {
        const formData: Record<string, unknown> = {
            billing: {
                billingAccountId: 12345,
                markup: 0.58,
            },
            description: 'Public specification',
            name: 'Billing markup challenge',
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        }

        const result = transformFormDataToChallenge(formData as any)

        expect(result.billing)
            .toEqual({
                billingAccountId: 12345,
                markup: 0.58,
            })
    })
})

describe('challenge-editor utils submission count mapping', () => {
    it('keeps numOfSubmissions in form data so AI review locking can use it', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'Submission challenge',
            numOfSubmissions: 1,
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.numOfSubmissions)
            .toBe(1)
    })

    it('keeps phase completion dates in form data so completed schedule rows stay locked', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'Completed phase challenge',
            phases: [{
                actualEndDate: '2026-04-09T00:15:00.000Z',
                duration: 900,
                isOpen: false,
                name: 'Registration',
                phaseId: 'registration-phase',
                scheduledEndDate: '2026-04-09T00:15:00.000Z',
                scheduledStartDate: '2026-04-09T00:00:00.000Z',
            }],
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.phases)
            .toEqual(expect.arrayContaining([
                expect.objectContaining({
                    actualEndDate: '2026-04-09T00:15:00.000Z',
                    isOpen: false,
                    phaseId: 'registration-phase',
                }),
            ]))
    })
})

describe('challenge-editor utils schedule mapping', () => {
    it('serializes scheduled phase end dates to the API payload', () => {
        const formData: Record<string, unknown> = {
            description: 'Public specification',
            legacy: {
                useSchedulingAPI: true,
            },
            name: 'Scheduled challenge',
            phases: [{
                duration: 1440,
                phaseId: 'submission-phase',
                scheduledEndDate: '2026-04-15T15:05:00.000Z',
                scheduledStartDate: '2026-04-09T15:05:00.000Z',
            }],
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        }

        const result = transformFormDataToChallenge(formData as any)

        expect(result.phases)
            .toEqual([{
                duration: 1440,
                phaseId: 'submission-phase',
                scheduledEndDate: '2026-04-15T15:05:00.000Z',
                scheduledStartDate: '2026-04-09T15:05:00.000Z',
            }])
    })
})

describe('challenge-editor utils task reviewer mapping', () => {
    it('maps task reviewer and task flag into form data', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'Task challenge',
            reviewer: 'jcori',
            task: {
                isTask: true,
            },
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.reviewer)
            .toBe('jcori')
        expect(result.legacy?.isTask)
            .toBe(true)
    })

    it('maps copilot and reviewer from alternate saved challenge payload shapes', () => {
        const result = transformChallengeToFormData({
            copilotHandle: 'copilotUser',
            description: 'Public specification',
            name: 'Task challenge',
            task: {
                isTask: true,
                reviewerHandle: 'reviewerUser',
            },
            trackId: 'track-id',
            typeId: 'type-id',
        } as any)

        expect(result.copilot)
            .toBe('copilotUser')
        expect(result.reviewer)
            .toBe('reviewerUser')
        expect(result.legacy?.isTask)
            .toBe(true)
    })

    it('prefers reviewer handles from saved reviewer objects', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'Task challenge',
            reviewer: {
                handle: 'reviewerUser',
                userId: 123456,
            } as any,
            task: {
                isTask: true,
            },
            trackId: 'track-id',
            typeId: 'type-id',
        } as any)

        expect(result.reviewer)
            .toBe('reviewerUser')
    })

    it('serializes task reviewer but omits legacy.isTask from API payload', () => {
        const formData: Record<string, unknown> = {
            description: 'Public specification',
            legacy: {
                isTask: true,
                reviewType: 'INTERNAL',
                useSchedulingAPI: true,
            },
            name: 'Task challenge',
            reviewer: 'jcori',
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        }

        const result = transformFormDataToChallenge(formData as any)

        expect(result.reviewer)
            .toBe('jcori')
        expect(result.legacy)
            .toEqual({
                reviewType: 'INTERNAL',
                useSchedulingAPI: true,
            })
    })
})

describe('challenge-editor utils round type mapping', () => {
    it('maps to two rounds when checkpoint phases are present and roundType is missing', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'Design challenge',
            phases: [
                {
                    duration: 3600,
                    name: 'Registration',
                    phaseId: 'registration',
                },
                {
                    duration: 3600,
                    name: 'Checkpoint Submission',
                    phaseId: 'checkpoint-submission',
                },
                {
                    duration: 3600,
                    name: 'Checkpoint Screening',
                    phaseId: 'checkpoint-screening',
                },
                {
                    duration: 3600,
                    name: 'Checkpoint Review',
                    phaseId: 'checkpoint-review',
                },
            ],
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.roundType)
            .toBe('Two rounds')
    })

    it('maps to single round when checkpoint phases are not present and roundType is missing', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'Design challenge',
            phases: [
                {
                    duration: 3600,
                    name: 'Registration',
                    phaseId: 'registration',
                },
                {
                    duration: 3600,
                    name: 'Submission',
                    phaseId: 'submission',
                },
            ],
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.roundType)
            .toBe('Single round')
    })
})

describe('challenge-editor utils design work type mapping', () => {
    it('maps design work type from tags into form data', () => {
        const result = transformChallengeToFormData({
            description: 'Public specification',
            name: 'Design challenge',
            tags: [
                'Application Front-End Design',
                'tag-1',
            ],
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result.workType)
            .toBe('Application Front-End Design')
    })

    it('serializes selected design work type into tags and removes stale work type tag', () => {
        const formData: Record<string, unknown> = {
            description: 'Public specification',
            name: 'Design challenge',
            skills: [],
            tags: [
                'Wireframes',
                'tag-1',
            ],
            trackId: 'track-id',
            typeId: 'type-id',
            workType: 'Application Front-End Design',
        }

        const result = transformFormDataToChallenge(formData as any)

        expect(result.tags)
            .toEqual([
                'tag-1',
                'Application Front-End Design',
            ])
    })
})

describe('challenge-editor utils terms mapping', () => {
    it('keeps an empty groups array in API payloads to clear groups on update', () => {
        const formData: Record<string, unknown> = {
            description: 'Public specification',
            groups: [],
            name: 'Design challenge',
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        }

        const result = transformFormDataToChallenge(formData as any)

        expect(result.groups)
            .toEqual([])
    })

    it('keeps an empty terms array in API payloads to clear terms on update', () => {
        const formData: Record<string, unknown> = {
            description: 'Public specification',
            name: 'Design challenge',
            skills: [],
            tags: [],
            terms: [],
            trackId: 'track-id',
            typeId: 'type-id',
        }

        const result = transformFormDataToChallenge(formData as any)

        expect(result.terms)
            .toEqual([])
    })
})

describe('challenge-editor utils attachment mapping', () => {
    it('maps legacy attachment fileName values into form data attachments', () => {
        const result = transformChallengeToFormData({
            attachments: [{
                fileName: 'specification.pdf',
                fileSize: 1024,
                id: 'attachment-1',
                url: 'https://example.com/specification.pdf',
            }],
            description: 'Public specification',
            name: 'Design challenge',
            trackId: 'track-id',
            typeId: 'type-id',
        } as any)

        expect(result.attachments)
            .toEqual([{
                fileSize: 1024,
                id: 'attachment-1',
                name: 'specification.pdf',
                url: 'https://example.com/specification.pdf',
            }])
    })
})
