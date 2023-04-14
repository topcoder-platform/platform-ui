export interface GlobalConfig {
    TOPCODER_URL: string
    PLATFORMUI_URL: string
    API: {
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
    SPRIG: {
        ENVIRONMENT_ID: string | undefined
    }
    STRIPE: {
        ADMIN_TOKEN: string | undefined
        API_KEY: string
        API_VERSION: string | undefined
        CUSTOMER_TOKEN: string | undefined
    }
    URLS: {
        USER_PROFILE: string
        ACCOUNT_SETTINGS: string
        UNIVERSAL_NAV: string
    }
    MEMBER_VERIFY_LOOKER: number,
    ENABLE_TCA_CERT_MONETIZATION: boolean
    VANILLA_FORUM: {
        ACCESS_TOKEN: string
        V2_URL: string
    }
}
