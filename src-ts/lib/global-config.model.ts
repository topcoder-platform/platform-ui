export interface GlobalConfig {
    API: {
        FORUM_ACCESS_TOKEN: string
        FORUM_V2: string
        V3: string
        V5: string
    }
    DISABLED_TOOLS?: Array<string>
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
