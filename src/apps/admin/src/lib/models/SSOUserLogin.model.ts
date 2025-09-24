/**
 * Model for sso user login
 */
export interface SSOUserLogin {
    userId: string
    name: string
    email: string
    providerType: string
    provider: string
    context: any
    social: boolean
    enterprise: boolean
    emailVerified: boolean
}
