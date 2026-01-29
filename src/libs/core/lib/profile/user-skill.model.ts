export type UserSkillCategory = {
    id: string
    name: string
    description?: string
}

// keep this in sync with the backend
// https://github.com/topcoder-platform/standardized-skills-api/blob/develop/src/config/constants.ts#L23
export enum UserSkillLevelTypes {
    selfDeclared = 'self-declared',
    verified = 'verified',
}

// keep this in sync with the backend
// https://github.com/topcoder-platform/standardized-skills-api/blob/develop/src/config/constants.ts#L28
export enum UserSkillDisplayModes {
    additional = 'additional',
    principal = 'principal',
}

export type UserSkillLevel = {
    id: string
    name: UserSkillLevelTypes
    description: string
}

export type UserSkillDisplayMode = {
    id: string
    name: UserSkillDisplayModes
}

export type UserSkill = {
    id: string
    name: string
    category: UserSkillCategory
    levels: Array<UserSkillLevel>
    displayMode: UserSkillDisplayMode
    description?: string | null | undefined
}

export type UserSkillActivity = {
    count: number
    lastSources: Array<{
        id?: string
        completionEventId?: string
        title?: string
        name?: string
        certification?: string
        dashedName?: string
    }>
}

export type UserSkillWithActivity = {
    lastUsedDate: string
    activity: {
        certification?: UserSkillActivity
        course?: UserSkillActivity
        challenge?: UserSkillActivity
        engagement?: UserSkillActivity
    }
} & UserSkill

export type SearchUserSkill = Pick<UserSkill, 'id'|'name'> & Partial<Pick<UserSkill, 'levels'>>
