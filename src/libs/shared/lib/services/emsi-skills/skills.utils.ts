import { EmsiSkill, EmsiSkillSources } from './skill.model'

export const isSkillVerified = (skill: Pick<EmsiSkill, 'skillSources'>): boolean => (
    skill.skillSources.includes(EmsiSkillSources.challengeWin)
)
