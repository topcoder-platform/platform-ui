import { ChallengeType } from '../../../../lib/models'

import {
    buildChallengeTypeOptions,
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

describe('buildChallengeTypeOptions', () => {
    it('keeps only active launchable challenge types and sorts them by label', () => {
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
})
