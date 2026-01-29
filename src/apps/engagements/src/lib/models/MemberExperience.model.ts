export interface MemberExperience {
    id: string
    engagementAssignmentId: string
    experienceText: string
    createdAt: string
    updatedAt: string
    memberId?: string
    memberHandle?: string
}

export interface CreateMemberExperienceRequest {
    experienceText: string
}

export interface UpdateMemberExperienceRequest {
    experienceText: string
}
