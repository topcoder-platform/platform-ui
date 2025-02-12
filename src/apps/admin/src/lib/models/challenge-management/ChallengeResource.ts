export interface ResourceRole {
    id: string
    name: string
}

export interface ResourceEmail {
    userId: number
    email: string
}

export interface ChallengeResource {
    id: number
    memberId: string
    memberHandle: string
    roleId: ResourceRole['id']
    created: string
}
