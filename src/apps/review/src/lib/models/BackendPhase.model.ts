import { BackendConstraint } from './BackendConstraint.model'

export interface BackendPhase {
    id: string
    phaseId: string
    name: string
    description: string
    isOpen: boolean
    predecessor?: string
    duration: number
    scheduledStartDate: string
    scheduledEndDate: string
    actualStartDate?: string
    actualEndDate?: string
    constraints: BackendConstraint[]
}
