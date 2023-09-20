export enum SkillSources {
    selfPicked = 'SelfPicked',
    challengeWin = 'ChallengeWin',
    tcaCertified = 'TCACertified',
}

export type UserSkill = {
    id: string
    name: string
    skillCategory?: {
        name: string
        id: number
    }
    skillId?: string
    skillSources?: SkillSources[]
    skillSubcategory?: {
        name: string
        id: number
    }
}
