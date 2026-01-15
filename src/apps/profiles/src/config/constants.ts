// import { EnvironmentConfig } from '~/config'

export enum TRACKS_PROFILE_MAP {
    DEVELOP = 'Developer',
    DESIGN = 'Designer',
    DATA_SCIENCE = 'Data Scientist',
}

export const TC_VERIFIED_SKILL_LABEL: string = 'Topcoder Verified'

export const EDIT_MODE_QUERY_PARAM: string = 'edit-mode'

export enum profileEditModes {
    aboutMe = 'aboutMe',
    languages = 'languages',
    links = 'links',
    openForWork = 'openForWork',
    names = 'names',
    photo = 'photo',
    workExperience = 'workExperience',
    education = 'education',
    skills = 'skills',
    onboardingCompleted = 'onboardingCompleted',
}

// (removed) CES Survey/Userflow integrations

export const MAX_PRINCIPAL_SKILLS_COUNT = 10

export enum ADMIN_ROLES_ENUM {
    ADMINISTRATOR = 'administrator',
    ADMIN = 'admin',
}

export const ADMIN_ROLES = [ADMIN_ROLES_ENUM.ADMINISTRATOR, ADMIN_ROLES_ENUM.ADMIN]
