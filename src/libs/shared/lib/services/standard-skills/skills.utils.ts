import { Skill, SkillSources } from './skill.model'

export const isSkillVerified = (skill: Pick<Skill, 'skillSources'>): boolean => (
    !!skill.skillSources?.includes(SkillSources.challengeWin)
)
