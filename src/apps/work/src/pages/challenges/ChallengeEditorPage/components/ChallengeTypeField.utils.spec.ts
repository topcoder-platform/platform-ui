import {
    ChallengeType,
    Track,
} from '../../../../lib/models'

import {
    buildChallengeTypeOptions,
    getChallengeTypeFilterTrack,
    isMarathonMatchChallengeType,
    isTopgearTaskChallengeType,
} from './ChallengeTypeField.utils'

function buildChallengeType(overrides: Partial<ChallengeType>): ChallengeType {
    return {
        abbreviation: 'CH',
        id: 'challenge-type-id',
        isActive: true,
        name: 'Challenge',
        ...overrides,
    }
}

function buildTrack(overrides: Partial<Track>): Track {
    return {
        id: 'track-id',
        isActive: true,
        name: 'Development',
        track: 'DEVELOPMENT',
        ...overrides,
    }
}

describe('isTopgearTaskChallengeType', () => {
    it('matches Topgear Task by abbreviation', () => {
        expect(isTopgearTaskChallengeType(buildChallengeType({
            abbreviation: 'TGT',
            name: 'Some Other Name',
        })))
            .toBe(true)
    })

    it('matches Topgear Task by normalized name', () => {
        expect(isTopgearTaskChallengeType(buildChallengeType({
            abbreviation: 'OTHER',
            name: 'Topgear Task',
        })))
            .toBe(true)
    })

    it('returns false for other challenge types', () => {
        expect(isTopgearTaskChallengeType(buildChallengeType({
            abbreviation: 'MM',
            name: 'Marathon Match',
        })))
            .toBe(false)
    })
})

describe('isMarathonMatchChallengeType', () => {
    it('matches Marathon Match by abbreviation', () => {
        expect(isMarathonMatchChallengeType(buildChallengeType({
            abbreviation: 'MM',
            name: 'Some Other Name',
        })))
            .toBe(true)
    })

    it('matches Marathon Match by normalized name', () => {
        expect(isMarathonMatchChallengeType(buildChallengeType({
            abbreviation: 'OTHER',
            name: 'Marathon Match',
        })))
            .toBe(true)
    })

    it('returns false for other challenge types', () => {
        expect(isMarathonMatchChallengeType(buildChallengeType({
            abbreviation: 'F2F',
            name: 'First2Finish',
        })))
            .toBe(false)
    })
})

describe('getChallengeTypeFilterTrack', () => {
    it('normalizes quality assurance aliases', () => {
        expect(getChallengeTypeFilterTrack(buildTrack({
            abbreviation: 'QA',
            name: 'Quality Assurance',
            track: 'QA',
        })))
            .toBe('QA')
    })

    it('normalizes development aliases', () => {
        expect(getChallengeTypeFilterTrack(buildTrack({
            abbreviation: 'DEV',
            name: 'Development',
            track: 'Development',
        })))
            .toBe('DEVELOP')
    })

    it('returns an empty string when no track is selected', () => {
        expect(getChallengeTypeFilterTrack())
            .toBe('')
    })
})

describe('buildChallengeTypeOptions', () => {
    it('keeps only active configured challenge types and sorts them by label', () => {
        const options = buildChallengeTypeOptions([
            buildChallengeType({
                abbreviation: 'TGT',
                id: 'topgear-task-id',
                name: 'Topgear Task',
            }),
            buildChallengeType({
                abbreviation: 'F2F',
                id: 'first-2-finish-id',
                name: 'First2Finish',
            }),
            buildChallengeType({
                abbreviation: 'CH',
                id: 'challenge-id',
                name: 'Challenge',
            }),
            buildChallengeType({
                abbreviation: 'AI',
                id: 'ai-id',
                name: 'AI',
            }),
            buildChallengeType({
                abbreviation: 'AIE',
                id: 'ai-engineering-id',
                name: 'AI Engineering',
            }),
            buildChallengeType({
                abbreviation: 'TEST',
                id: 'test-id',
                name: 'test11775112200655',
            }),
            buildChallengeType({
                abbreviation: 'MM',
                id: 'inactive-marathon-match-id',
                isActive: false,
                name: 'Marathon Match',
            }),
        ])

        expect(options)
            .toEqual([
                {
                    label: 'Challenge',
                    value: 'challenge-id',
                },
                {
                    label: 'First2Finish',
                    value: 'first-2-finish-id',
                },
            ])
    })

    it('hides Marathon Match for Design tracks', () => {
        const options = buildChallengeTypeOptions([
            buildChallengeType({
                abbreviation: 'CH',
                id: 'challenge-id',
                name: 'Challenge',
            }),
            buildChallengeType({
                abbreviation: 'MM',
                id: 'marathon-match-id',
                name: 'Marathon Match',
            }),
            buildChallengeType({
                abbreviation: 'F2F',
                id: 'first-2-finish-id',
                name: 'First2Finish',
            }),
            buildChallengeType({
                abbreviation: 'TSK',
                id: 'task-id',
                name: 'Task',
            }),
            buildChallengeType({
                abbreviation: 'AI',
                id: 'ai-id',
                name: 'AI',
            }),
            buildChallengeType({
                abbreviation: 'AIE',
                id: 'ai-engineering-id',
                name: 'AI Engineering',
            }),
        ], buildTrack({
            name: 'Design',
            track: 'DESIGN',
        }))

        expect(options)
            .toEqual([
                {
                    label: 'Challenge',
                    value: 'challenge-id',
                },
                {
                    label: 'First2Finish',
                    value: 'first-2-finish-id',
                },
                {
                    label: 'Task',
                    value: 'task-id',
                },
            ])
    })

    it('hides Marathon Match for Quality Assurance tracks', () => {
        const options = buildChallengeTypeOptions([
            buildChallengeType({
                abbreviation: 'CH',
                id: 'challenge-id',
                name: 'Challenge',
            }),
            buildChallengeType({
                abbreviation: 'MM',
                id: 'marathon-match-id',
                name: 'Marathon Match',
            }),
            buildChallengeType({
                abbreviation: 'F2F',
                id: 'first-2-finish-id',
                name: 'First2Finish',
            }),
            buildChallengeType({
                abbreviation: 'TSK',
                id: 'task-id',
                name: 'Task',
            }),
        ], buildTrack({
            abbreviation: 'QA',
            name: 'Quality Assurance',
            track: 'QA',
        }))

        expect(options)
            .toEqual([
                {
                    label: 'Challenge',
                    value: 'challenge-id',
                },
                {
                    label: 'First2Finish',
                    value: 'first-2-finish-id',
                },
                {
                    label: 'Task',
                    value: 'task-id',
                },
            ])
    })

    it('shows Marathon Match for Development tracks', () => {
        const options = buildChallengeTypeOptions([
            buildChallengeType({
                abbreviation: 'CH',
                id: 'challenge-id',
                name: 'Challenge',
            }),
            buildChallengeType({
                abbreviation: 'F2F',
                id: 'first-2-finish-id',
                name: 'First2Finish',
            }),
            buildChallengeType({
                abbreviation: 'MM',
                id: 'marathon-match-id',
                name: 'Marathon Match',
            }),
            buildChallengeType({
                abbreviation: 'TSK',
                id: 'task-id',
                name: 'Task',
            }),
        ], buildTrack({
            name: 'Development',
            track: 'Development',
        }))

        expect(options)
            .toEqual([
                {
                    label: 'Challenge',
                    value: 'challenge-id',
                },
                {
                    label: 'First2Finish',
                    value: 'first-2-finish-id',
                },
                {
                    label: 'Marathon Match',
                    value: 'marathon-match-id',
                },
                {
                    label: 'Task',
                    value: 'task-id',
                },
            ])
    })

    it('shows Marathon Match for Data Science tracks', () => {
        const options = buildChallengeTypeOptions([
            buildChallengeType({
                abbreviation: 'CH',
                id: 'challenge-id',
                name: 'Challenge',
            }),
            buildChallengeType({
                abbreviation: 'MM',
                id: 'marathon-match-id',
                name: 'Marathon Match',
            }),
        ], buildTrack({
            name: 'Data Science',
            track: 'DATA_SCIENCE',
        }))

        expect(options)
            .toEqual([
                {
                    label: 'Challenge',
                    value: 'challenge-id',
                },
                {
                    label: 'Marathon Match',
                    value: 'marathon-match-id',
                },
            ])
    })
})
