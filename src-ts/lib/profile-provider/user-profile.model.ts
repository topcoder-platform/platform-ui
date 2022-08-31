export interface UserProfile {
    competitionCountryCode: string
    createdAt: number
    email: string
    firstName: string
    handle: string
    handleLower: string
    homeCountryCode: string
    isCustomer?: boolean
    isMember?: boolean
    lastName: string
    photoURL?: string
    roles: Array<string>
    status: string
    updatedAt: number
    userId: number
}
