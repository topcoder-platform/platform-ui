/**
 * Model for member info
 */
export interface MemberInfo {
    handle: string
    userId: number
    firstName?: string | null
    lastName?: string | null
    photoURL?: string | null
    maxRating?: unknown
}
