export interface AuthUser {
    exp?: number
    handle: string
    roles: Array<{ [key: string]: any }>
    userId: string
}
