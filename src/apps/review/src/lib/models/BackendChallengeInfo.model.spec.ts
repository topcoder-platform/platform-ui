import { BackendChallengeInfo, convertBackendChallengeInfo } from './BackendChallengeInfo.model'

jest.mock('~/config', () => ({
    EnvironmentConfig: {},
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#000000'),
}), { virtual: true })

const buildChallengeInfo = (
    winners: BackendChallengeInfo['winners'],
): BackendChallengeInfo => ({
    created: '2026-01-01T00:00:00.000Z',
    createdBy: 'tester',
    currentPhaseNames: [],
    description: '',
    descriptionFormat: 'markdown',
    discussions: [],
    endDate: '2026-01-03T00:00:00.000Z',
    groups: [],
    id: 'challenge-id',
    legacy: {} as BackendChallengeInfo['legacy'],
    metadata: [],
    name: 'Legacy Challenge',
    numOfCheckpointSubmissions: 0,
    numOfRegistrants: 0,
    numOfSubmissions: 0,
    overview: {} as BackendChallengeInfo['overview'],
    phases: [],
    prizeSets: [],
    projectId: 1,
    registrationEndDate: '2026-01-02T00:00:00.000Z',
    registrationStartDate: '2026-01-01T00:00:00.000Z',
    skills: [],
    startDate: '2026-01-01T00:00:00.000Z',
    status: 'COMPLETED',
    submissionEndDate: '2026-01-02T00:00:00.000Z',
    submissionStartDate: '2026-01-01T00:00:00.000Z',
    tags: [],
    task: {} as BackendChallengeInfo['task'],
    terms: [],
    timelineTemplateId: 'timeline-id',
    track: {
        id: 'track-id',
        name: 'Quality Assurance',
    },
    trackId: 'track-id',
    type: {
        id: 'type-id',
        name: 'Challenge',
    },
    typeId: 'type-id',
    updated: '2026-01-01T00:00:00.000Z',
    updatedBy: 'tester',
    winners,
})

describe('convertBackendChallengeInfo winners mapping', () => {
    it('keeps contest winners when legacy winner type uses spaces', () => {
        const result = convertBackendChallengeInfo(buildChallengeInfo([
            {
                handle: 'winnerHandle',
                placement: 1,
                type: 'Contest Submission',
                userId: 1234,
            },
        ]))

        expect(result?.winners)
            .toEqual([
                {
                    handle: 'winnerHandle',
                    maxRating: undefined,
                    placement: 1,
                    type: 'Contest Submission',
                    userId: 1234,
                },
            ])
    })

    it('filters out checkpoint winners', () => {
        const result = convertBackendChallengeInfo(buildChallengeInfo([
            {
                handle: 'checkpointHandle',
                placement: 1,
                type: 'Checkpoint Submission',
                userId: 9999,
            },
        ]))

        expect(result?.winners)
            .toEqual([])
    })
})
