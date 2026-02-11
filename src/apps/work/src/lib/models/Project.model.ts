import { PROJECT_STATUSES } from '../constants'

import type {
    ProjectInvite,
    ProjectMember,
} from './ProjectMember.model'
import { TaasJob } from './TaasJob.model'

export type ProjectStatus = typeof PROJECT_STATUSES[number]['value']

export interface Project {
    id: number | string
    name: string
    status: ProjectStatus
    billingAccountId?: string | number
    description?: string
    type?: string
    cancelReason?: string
    terms?: string[]
    groups?: string[]
    createdAt?: string
    updatedAt?: string
    lastActivityAt?: string
    members?: ProjectMember[]
    invites?: ProjectInvite[]
    isInvited?: boolean
    details?: {
        taasDefinition?: {
            taasJobs?: TaasJob[]
        }
    }
}

export interface ProjectType {
    key: string
    displayName: string
    description?: string
}

export interface CreateProjectPayload {
    name: string
    description: string
    type: string
    billingAccountId?: number | string
    terms?: string[]
    groups?: string[]
}

export interface UpdateProjectPayload {
    name: string
    description: string
    billingAccountId?: number | string
    status?: ProjectStatus
    cancelReason?: string
    terms?: string[]
    groups?: string[]
}

export interface ProjectFilters {
    keyword?: string
    status?: ProjectStatus | ProjectStatus[]
    memberOnly?: boolean
}

export interface ProjectPhaseProduct {
    details?: Record<string, unknown>
    id?: string
    name?: string
    status?: string
    templateId?: number | string
    type?: string
    [key: string]: unknown
}

export interface ProjectPhase {
    id: string
    name?: string
    products?: ProjectPhaseProduct[]
    status?: string
    [key: string]: unknown
}
