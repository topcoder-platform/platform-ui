export interface Group {
    id: string
    name: string
    description?: string
    oldId?: string
    privateGroup?: boolean
    selfRegister?: boolean
    status?: string
}

export interface GroupCreatePayload {
    description?: string
    name: string
    privateGroup?: boolean
    selfRegister?: boolean
}

export interface GroupBulkCreatePayload {
    description: string
    name: string
    privateGroup: boolean
    selfRegister: boolean
    userIds: string[]
}

export interface GroupUpdatePayload {
    description?: string
    name: string
    oldId?: string
    privateGroup: boolean
    selfRegister: boolean
}

export interface GroupPatchPayload {
    oldId: string
}

export interface GroupBulkCreateMemberResult {
    error?: string
    success: boolean
    userId: string
}

export interface GroupBulkCreateResponse extends Group {
    memberResults?: GroupBulkCreateMemberResult[]
}

export type GroupMembershipType = 'group' | 'user'

export interface GroupMember {
    createdAt?: string
    groupId: string
    groupName?: string
    id: string
    memberId: string
    membershipType: GroupMembershipType
    universalUID?: string
}

export interface GroupMemberCreatePayload {
    memberId: string
    membershipType: GroupMembershipType
}

export interface MemberValidationResult {
    email?: string
    handle?: string
    input: string
    match: boolean
    matched?: boolean
    userId?: string
}

export interface GroupOption {
    label: string
    value: string
}
