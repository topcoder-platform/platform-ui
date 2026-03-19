export interface ProjectMember {
    id?: number | string
    userId?: number
    handle?: string
    email?: string
    role?: string
    projectId?: number | string
    createdAt?: string
    updatedAt?: string
}

export interface ProjectInvite {
    id?: number | string
    email?: string
    handle?: string
    userId?: number
    role?: string
    status?: string
    projectId?: number | string
    createdAt?: string
    updatedAt?: string
}
