import { SKILL_SEARCH_MINIMUM } from '../../config'

import {
    canSearchTalentMatches,
    isTalentSearchLoading,
} from './use-fetch-talent-matches'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V6: 'https://api.topcoder.com/v6',
        },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrGetPaginatedAsync: jest.fn(),
}), { virtual: true })

jest.mock('swr', () => jest.fn())

const createSkills = (count: number): Array<{ id: string; name: string }> => (
    Array.from({ length: count }, (_, index) => ({
        id: `skill-${index + 1}`,
        name: `Skill ${index + 1}`,
    }))
)

describe('useFetchTalentMatches', () => {
    it('requires at least the configured minimum number of skills to search', () => {
        expect(canSearchTalentMatches(createSkills(SKILL_SEARCH_MINIMUM - 1) as any))
            .toBe(false)
        expect(canSearchTalentMatches(createSkills(SKILL_SEARCH_MINIMUM) as any))
            .toBe(true)
    })

    it('shows loading only when search can run and no data or error exists', () => {
        expect(isTalentSearchLoading(true, undefined, undefined))
            .toBe(true)
        expect(isTalentSearchLoading(false, undefined, undefined))
            .toBe(false)
        expect(isTalentSearchLoading(true, { data: [] } as any, undefined))
            .toBe(false)
    })

    it('exits loading state when the search request fails', () => {
        expect(isTalentSearchLoading(true, undefined, new Error('request failed')))
            .toBe(false)
    })
})
