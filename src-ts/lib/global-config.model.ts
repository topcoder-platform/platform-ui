export interface GlobalConfig {
    ANALYTICS: {
        SEGMENT_KEY?: string
        TAG_MANAGER_ID?: string
    }
    API: {
        FORUM_ACCESS_TOKEN: string
        FORUM_V2: string
        V3: string
        V5: string
    }
    DISABLED_TOOLS?: Array<string>
    ENV: string
    LEARN_SRC: string,
    LOGGING: {
        PUBLIC_TOKEN: string
        SERVICE: string
    }
    REAUTH_OFFSET: number
    STRIPE: {
        ADMIN_TOKEN: string
        API_KEY: string
        API_VERSION: string
        CUSTOMER_TOKEN: string
    }
    TOPCODER_URLS: {
        CHALLENGES_PAGE: string,
        GIGS_PAGE: string,
        USER_PROFILE: string,
    }
    URL: {
        ACCOUNTS_APP_CONNECTOR: string
    },
}
