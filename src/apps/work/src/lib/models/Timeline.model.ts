export interface TimelineTemplatePhase {
    phaseId: string
    name?: string
    duration: number
    predecessor?: string
    isActive: boolean
}

export interface TimelineTemplate {
    id: string
    name: string
    trackId: string
    typeId: string
    isDefault?: boolean
    isActive: boolean
    phases: TimelineTemplatePhase[]
}

export interface ChallengeTimelineTemplate {
    id: string
    typeId: string
    trackId: string
    timelineTemplateId: string
    isDefault: boolean
}

export interface PhaseDefinition {
    id: string
    name: string
    description?: string
    isActive: boolean
}
