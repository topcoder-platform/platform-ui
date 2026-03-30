import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { SKILLS_V5_SKILLS_URL } from '../constants'
import { Skill } from '../models'

const SKILLS_API_URL = `${EnvironmentConfig.STANDARDIZED_SKILLS_API}/skills/autocomplete`

function normalizeSkill(skill: Partial<Skill>): Skill | undefined {
    const id = typeof skill.id === 'string'
        ? skill.id
        : ''
    const name = typeof skill.name === 'string'
        ? skill.name
        : ''

    if (!id || !name) {
        return undefined
    }

    return {
        id,
        name,
    }
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    const errorMessage = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    return new Error(errorMessage)
}

export async function searchSkills(term: string): Promise<Skill[]> {
    const normalizedTerm = term.trim()

    if (!normalizedTerm) {
        return []
    }

    try {
        const response = await xhrGetAsync<Skill[]>(
            `${SKILLS_API_URL}?term=${encodeURIComponent(normalizedTerm)}`,
        )

        return (response || [])
            .map(skill => normalizeSkill(skill))
            .filter((skill): skill is Skill => !!skill)
    } catch (error) {
        throw normalizeError(error, 'Failed to search skills')
    }
}

export async function fetchSkillsByIds(
    skillIds: string[] | string = [],
): Promise<Skill[]> {
    const normalizedSkillsIds = Array.from(new Set(
        (Array.isArray(skillIds) ? skillIds : [skillIds])
            .map(skillId => String(skillId)
                .trim())
            .filter(Boolean),
    ))

    if (!normalizedSkillsIds.length) {
        return []
    }

    const query = new URLSearchParams()

    normalizedSkillsIds.forEach(skillId => {
        query.append('skillId', skillId)
    })

    query.set('disablePagination', 'true')

    try {
        const response = await xhrGetAsync<unknown>(
            `${SKILLS_V5_SKILLS_URL}?${query.toString()}`,
        )

        if (!Array.isArray(response)) {
            return []
        }

        return response
            .map(skill => normalizeSkill(skill as Partial<Skill>))
            .filter((skill): skill is Skill => !!skill)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch skills by IDs')
    }
}
