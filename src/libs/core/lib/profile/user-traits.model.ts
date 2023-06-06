export type UserTrait = {
    [key: string]: any
}

export type UserTraits = {
    categoryName: string
    createdAt?: number
    createdBy?: number
    traitId: string
    traits: {
        data: Array<UserTrait>
        traitId?: string
    }
    updatedAt?: number
    updatedBy?: number
    userId?: number
}
