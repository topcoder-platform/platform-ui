export type skillSources = 'USER_ENTERED' | 'CHALLENGE'

export type UserSkill = {
    id: number
    hidden: boolean
    score: number
    sources: skillSources[]
    tagName: string
}

export type EMSISkillSources = 'TCACertified' | 'SelfPicked' | 'ChallengeWin'

export type UserEMSISkill = {
    id: string
    name: string
    skillCategory: {
        name: string
        id: number
    }
    skillId: string
    skillSources: Array<EMSISkillSources>
    skillSubcategory: {
        name: string
        id: number
    }
}
