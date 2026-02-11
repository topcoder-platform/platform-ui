export interface TimelineTemplatePhase {
    phaseId: string
    name: string
    duration: number
    predecessor?: string
    isActive: boolean
}

export interface TimelineTemplate {
    id: string
    name: string
    trackId: string
    typeId: string
    isActive: boolean
    phases: TimelineTemplatePhase[]
}

export interface PhaseDefinition {
    id: string
    name: string
    description?: string
    isActive: boolean
}
