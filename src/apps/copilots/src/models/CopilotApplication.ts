export enum CopilotApplicationStatus {
    INVITED = 'invited',
    ACCEPTED = 'accepted',
    PENDING = 'pending',
}

export interface ExistingMembership {
    role: string,
    id: number,
}

export interface CopilotApplication {
    id: number,
    notes?: string,
    createdAt: Date,
    opportunityId: string,
    handle?: string,
    userId: number,
    status: CopilotApplicationStatus,
    opportunityStatus: string,
    existingMembership?: ExistingMembership,
    projectName: string,
    onApplied: () => void,
}
