import { useCallback } from 'react'

import { EmsiSkill, Skill } from '~/libs/shared'

export type IsMatchingSkillFn = (skill: EmsiSkill) => boolean

export const useIsMatchingSkill = (skills: Skill[]): IsMatchingSkillFn => {
    const isMatchingSkill = useCallback((skill: EmsiSkill) => (
        !!skills.find(s => skill.skillId === s.emsiId)
    ), [skills])

    return isMatchingSkill
}
