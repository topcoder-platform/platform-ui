import { useCallback } from 'react'

import { UserSkill } from '~/libs/core'

export type IsMatchingSkillFn = (skill: Pick<UserSkill, 'id'>) => boolean

export const useIsMatchingSkill = (skills: UserSkill[]): IsMatchingSkillFn => {
    const isMatchingSkill = useCallback((skill: Pick<UserSkill, 'id'>) => (
        !!skills.find(s => skill.id === s.id)
    ), [skills])

    return isMatchingSkill
}
