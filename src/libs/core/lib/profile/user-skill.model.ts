export type SkillSources = 'TCACertified' | 'SelfPicked' | 'ChallengeWin'

export type UserEMSISkill = {
    id: string
    name: string
    skillCategory: {
        name: string
        id: number
    }
    skillId: string
    skillSources: Array<SkillSources>
    skillSubcategory: {
        name: string
        id: number
    }
}
