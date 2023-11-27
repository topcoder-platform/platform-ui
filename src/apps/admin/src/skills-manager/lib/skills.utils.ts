import { escapeRegExp, mapValues, orderBy } from 'lodash'

import { StandardizedSkill } from '../services'

export interface GroupedSkills {
    [id: string]: StandardizedSkill[]
}

export const groupSkillsByCategory = (skills: StandardizedSkill[]): GroupedSkills => {
    const groupedSkills = skills.reduce((grouped, skill) => {
        if (!grouped[skill.category.id]) {
            grouped[skill.category.id] = []
        }

        grouped[skill.category.id].push(skill)

        return grouped
    }, {} as GroupedSkills)

    const sortedGroupedSkills = mapValues(groupedSkills, s => orderBy(s, 'name', 'asc'))

    return sortedGroupedSkills
}

export const findSkillsMatches = (skills: StandardizedSkill[], skillsFilter: string): StandardizedSkill[] => {
    const filterRegex = new RegExp(escapeRegExp(skillsFilter), 'i')
    return skills.filter(skill => (
        filterRegex.test(skill.name) || filterRegex.test(skill.category.name)
    ))
}
