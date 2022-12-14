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
    AUTH: {
        ACCOUNTS_APP_CONNECTOR: string
    }
    DISABLED_TOOLS?: Array<string>
    ENV: string
    LOGGING: {
        PUBLIC_TOKEN: string
        SERVICE: string
    }
    REAUTH_OFFSET: number
    SPRIG: {
        ENVIRONMENT_ID: string
    }
    STRIPE: {
        ADMIN_TOKEN: string
        API_KEY: string
        API_VERSION: string
        CUSTOMER_TOKEN: string
    }
    TOPCODER_URLS: {
        API_BASE: string
        BLOG_PAGE: string
        CHALLENGES_PAGE: string
        GIGS_PAGE: string
        THRIVE_PAGE: string
        USER_PROFILE: string
        WP_CONTENT: string
    }
    UNIVERSAL_NAV: {
        URL: string
    }
}
