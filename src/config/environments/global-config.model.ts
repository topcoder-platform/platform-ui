export interface GlobalConfig {
    TC_DOMAIN: string
    TOPCODER_URL: string
    PLATFORMUI_URL: string
    USER_PROFILE_URL: string
    API: {
        V1: string
        V3: string
        V4: string
        V5: string
    }
    AUTH: {
        ACCOUNTS_APP_CONNECTOR: string
    }
    ENV: 'dev' | 'prod' | 'qa'
    LOGGING: {
        PUBLIC_TOKEN: string | undefined
        SERVICE: string
    }
    REAUTH_OFFSET: number
    STRIPE: {
        API_KEY: string
        API_VERSION: string | undefined
    }
    URLS: {
        USER_PROFILE: string
        ACCOUNT_SETTINGS: string
        UNIVERSAL_NAV: string
    }
    MEMBER_VERIFY_LOOKER: number
    ENABLE_TCA_CERT_MONETIZATION: boolean
    VANILLA_FORUM: {
        ACCESS_TOKEN: string
        V2_URL: string
    },
    SUBDOMAIN: string,
    GAMIFICATION_ORG_ID: string
    DICE_VERIFY_URL: string
    RESTRICT_TALENT_SEARCH: boolean
    SEGMENT_ANALYTICS_KEY: string
    USERFLOW_SURVEYS: {
        ACCOUNT_SETTINGS: string
        PROFILES: string
        TALENTSEARCH: string
    }
}
