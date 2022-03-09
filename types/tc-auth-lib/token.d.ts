// TODO: add this User class to tc-auth-lib
export interface User {
    exp?: number
    handle: string
    roles: Array<{ [key: string]: any }>
    userId: string
}

export function getToken(key: any): any
export function decodeToken(token: any): User
function isTokenExpired(token: any, offsetSeconds?: number): boolean
//# sourceMappingURL=token.d.ts.map