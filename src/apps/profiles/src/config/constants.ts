import { EnvironmentConfig } from '~/config'

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

export const CES_SURVEY_ID = EnvironmentConfig.USERFLOW_SURVEYS.PROFILES
