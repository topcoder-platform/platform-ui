export interface SSOLoginProviderConfig {
    ssoLoginProviderId: number
    name: string
    type: string
}

export interface LocalServiceOverride {
    prefix: string
    target: string
}

export interface GlobalConfig {
    TC_DOMAIN: string
    TOPCODER_URL: string
    PLATFORMUI_URL: string
    ENGAGEMENTS_URL: string
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
    TC_FINANCE_API: string,
    AUTH: {
        ACCOUNTS_APP_CONNECTOR: string
    }
    ENV: 'dev' | 'prod' | 'qa' | 'local'
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
        REVIEW_UI_URL: string
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
        OPPORTUNITIES_URL: string
    },
    FILESTACK: {
        API_KEY: string
        CNAME?: string
        REGION: string
        CONTAINER: string
        PATH_PREFIX: string
        SECURITY?: {
            POLICY: string
            SIGNATURE: string
        },
        RETRY: number
        TIMEOUT: number
        PROGRESS_INTERVAL: number
    },
    ADMIN_SSO_LOGIN_PROVIDERS: SSOLoginProviderConfig[]
    LOCAL_SERVICE_OVERRIDES?: LocalServiceOverride[]
    TROLLEY_WIDGET_ORIGIN: string
}
