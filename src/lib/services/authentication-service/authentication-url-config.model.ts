export interface AuthenticationUrlConfigModel {
    readonly authentication: string
    readonly login: (fallback: string) => string
    readonly logout: string
    readonly signup: (fallback: string) => string
}
