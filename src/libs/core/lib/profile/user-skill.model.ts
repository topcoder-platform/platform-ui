export type skillSources = 'USER_ENTERED' | 'CHALLENGE'

export type UserSkills = {
    [key: string]: {
        hidden: boolean
        score: number
        sources: skillSources[]
        tagName: string
    }
}
