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
    },
    STANDARDIZED_SKILLS_API: string,
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
        CHALLENGES_PAGE: string
    }
    MEMBER_VERIFY_LOOKER: number
    ENABLE_TCA_CERT_MONETIZATION: boolean
    VANILLA_FORUM: {
        V2_URL: string
    },
    SUBDOMAIN: string,
    GAMIFICATION_ORG_ID: string
    RESTRICT_TALENT_SEARCH: boolean
    USERFLOW_SURVEYS: {
        ACCOUNT_SETTINGS: string
        PROFILES: string
        TALENTSEARCH: string
    },
    ADMIN: {
        CONNECT_URL: string
        DIRECT_URL: string
        WORK_MANAGER_URL: string
        ONLINE_REVIEW_URL: string
    }
}
