import { useCallback } from 'react'

import { Skill } from '~/libs/shared'

export type IsMatchingSkillFn = (skill: Pick<Skill, 'id'>) => boolean

export const useIsMatchingSkill = (skills: Skill[]): IsMatchingSkillFn => {
    const isMatchingSkill = useCallback((skill: Pick<Skill, 'id'>) => (
        !!skills.find(s => skill.id === s.id)
    ), [skills])

    return isMatchingSkill
}
