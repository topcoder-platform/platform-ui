import { escapeRegExp, mapValues, orderBy } from 'lodash'

import { InputSelectOption } from '~/libs/ui'

import { StandardizedSkill, StandardizedSkillCategory } from '../services'

export interface GroupedSkills {
    [id: string]: StandardizedSkill[]
}

export const isSkillArchived = (skill: StandardizedSkill): boolean => (
    !!skill.deleted_at
)

export const groupSkillsByCategory = (skills: StandardizedSkill[]): GroupedSkills => {
    const groupedSkills = skills.reduce((grouped, skill) => {
        const categoryId = skill.category?.id
        if (!grouped[categoryId]) {
            grouped[categoryId] = []
        }

        grouped[categoryId].push(skill)

        return grouped
    }, {} as GroupedSkills)

    const sortedGroupedSkills = mapValues(groupedSkills, s => orderBy(s, 'name', 'asc'))

    return sortedGroupedSkills
}

export const findSkillsMatches = (skills: StandardizedSkill[], skillsFilter: string): StandardizedSkill[] => {
    const filterRegex = new RegExp(escapeRegExp(skillsFilter), 'i')
    return skills.filter(skill => (
        filterRegex.test(skill.name) || filterRegex.test(skill.category?.name ?? '')
    ))
}

export const mapCategoryToSelectOption = (
    categories: StandardizedSkillCategory[],
): InputSelectOption[] => (
    categories.map(c => ({ label: c.name, value: c.id }))
)
