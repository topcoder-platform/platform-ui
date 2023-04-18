export interface UserProfile {
    competitionCountryCode: string
    createdAt: number
    diceEnabled: boolean
    email: string
    firstName: string
    handle: string
    handleLower: string
    homeCountryCode: string
    isCustomer?: boolean
    isMember?: boolean
    isWipro: boolean
    lastName: string
    photoURL?: string
    roles: Array<string>
    status: string
    updatedAt: number
    userId: number
}