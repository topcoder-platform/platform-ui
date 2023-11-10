export type UserSkillCategory = {
    id: string
    name: string
}

// keep this in sync with the backend
// https://github.com/topcoder-platform/standardized-skills-api/blob/develop/src/config/constants.ts#L23
export enum UserSkillLevelTypes {
    selfDeclared = 'self-declared',
    verified = 'verified',
}

export type UserSkillLevel = {
    id: string
    name: UserSkillLevelTypes
    description: string
}

export type UserSkill = {
    id: string
    name: string
    category: UserSkillCategory
    levels: Array<UserSkillLevel>
}
