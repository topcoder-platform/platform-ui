export type UserTrait = {
    [key: string]: any
}

export enum UserTraitIds {
    basicInfo = 'basic_info',
    communities = 'communities',
    connectInfo = 'connect_info',
    device = 'device',
    education = 'education',
    hobby = 'hobby',
    languages = 'languages',
    onboardingChecklist = 'onboarding_checklist',
    personalization = 'personalization',
    serviceProvider = 'service_provider',
    software = 'software',
    subscription = 'subscription',
    work = 'work',
}

export enum UserTraitCategoryNames {
    basicInfo = 'Basic Info',
    communities = 'Communities',
    connectInfo = 'Connect User Information',
    device = 'Device',
    education = 'Education',
    hobby = 'Hobby',
    languages = 'Languages',
    onboardingChecklist = 'Onboarding Checklist',
    personalization = 'Personalization',
    serviceProvider = 'Service Provider',
    software = 'Software',
    subscription = 'Subscription',
    work = 'Work',
}

export type UserTraits = {
    categoryName: string
    createdAt?: number
    createdBy?: number
    traitId: string
    traits: {
        data: Array<UserTrait>
        traitId?: UserTraitIds
    }
    updatedAt?: number
    updatedBy?: number
    userId?: number
}
