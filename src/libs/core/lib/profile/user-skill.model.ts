export type skillSources = 'USER_ENTERED' | 'CHALLENGE'

export type UserSkill = {
    id: number
    hidden: boolean
    score: number
    sources: skillSources[]
    tagName: string
}
