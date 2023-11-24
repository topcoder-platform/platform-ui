import { escapeRegExp, orderBy } from 'lodash'

import { StandardizedSkill, StandardizedSkillCategory } from '../services'

export interface CategoryGroup extends StandardizedSkillCategory {
    skills: StandardizedSkill[]
}

export const groupSkillsByCategories = (skills: StandardizedSkill[]): CategoryGroup[] => {
    const allGroups = skills.reduce((grouped, skill) => {
        if (!grouped[skill.category.id]) {
            grouped[skill.category.id] = {
                ...skill.category,
                skills: [],
            }
        }

        grouped[skill.category.id].skills.push(skill)

        return grouped
    }, {} as {[key: string]: CategoryGroup})

    // sort groups, then sort skills, all by name ascending order
    const sortedGroups = orderBy(Object.values(allGroups), 'name', 'asc')
    const allSorted = sortedGroups.map(group => ({
        ...group,
        skills: orderBy(group.skills, 'name', 'asc'),
    }))

    return allSorted
}

export const findSkillsMatches = (skills: StandardizedSkill[], skillsFilter: string): StandardizedSkill[] => {
    const filterRegex = new RegExp(escapeRegExp(skillsFilter), 'i')
    return skills.filter(skill => (
        filterRegex.test(skill.name) || filterRegex.test(skill.category.name)
    ))
}
