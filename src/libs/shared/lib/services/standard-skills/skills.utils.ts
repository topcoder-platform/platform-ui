import { find } from 'lodash'

import { UserSkill, UserSkillLevelTypes } from '~/libs/core'

export const isSkillVerified = (skill: Pick<UserSkill, 'levels'>): boolean => (
    !!find(skill.levels, { name: UserSkillLevelTypes.verified })
)
