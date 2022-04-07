export interface GlobalConfig {
    API: {
        V3: string
        V5: string
    }
    DISABLED_FEATURES?: Array<string>
    ENV: string
    LOGGING: {
        PUBLIC_TOKEN: string
        SERVICE: string
    }
    REAUTH_OFFSET: number
    TAG_MANAGER_ID?: string
    URL: {
        ACCOUNTS_APP_CONNECTOR: string
    }
}
