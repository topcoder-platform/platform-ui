import { find } from 'lodash'

import { UserSkillLevelTypes } from '~/libs/core/lib/profile/user-skill.model'
import type { UserSkill } from '~/libs/core/lib/profile/user-skill.model'

export const isSkillVerified = (skill: Pick<UserSkill, 'levels'>): boolean => (
    !!find(skill.levels, { name: UserSkillLevelTypes.verified })
)
