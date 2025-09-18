export interface SSOLoginProviderConfig {
    ssoLoginProviderId: number
    name: string
    type: string
}

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
        V6: string
        URL: string
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
        DEFAULT_PAYMENT_TERMS: number
        DIRECT_URL: string
        WORK_MANAGER_URL: string
        ONLINE_REVIEW_URL: string
        CHALLENGE_URL: string
        AV_SCAN_SCORER_REVIEW_TYPE_ID: string
        AGREE_ELECTRONICALLY: string
        AGREE_FOR_DOCUSIGN_TEMPLATE: string
        AWS_REGION: string
        AWS_DMZ_BUCKET: string
        AWS_CLEAN_BUCKET: string
        AWS_QUARANTINE_BUCKET: string
        SUBMISSION_SCAN_TOPIC: string
        AVSCAN_TOPIC: string
    },
    REVIEW: {
        CHALLENGE_PAGE_URL: string
        PROFILE_PAGE_URL: string
    },
    ADMIN_SSO_LOGIN_PROVIDERS: SSOLoginProviderConfig[]
}
