export interface Resource {
    id?: string
    challengeId: string
    created?: string
    email?: string
    memberHandle?: string
    memberId?: string
    rating?: number
    role?: string
    roleId: string
    roleName?: string
}

export interface ResourcePayload {
    challengeId: string
    memberHandle?: string
    memberId?: string
    roleId: string
}

export interface ResourceRole {
    fullReadAccess?: boolean
    fullWriteAccess?: boolean
    id: string
    isActive?: boolean
    name: string
    selfObtainable?: boolean
}
