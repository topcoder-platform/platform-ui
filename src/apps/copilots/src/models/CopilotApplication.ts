export enum CopilotApplicationStatus {
    INVITED = 'invited',
    ACCEPTED = 'accepted',
    PENDING = 'pending',
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
}
