import { UserSkill } from '~/libs/core'

import { ProjectType } from '../constants'

import { CopilotOpportunity } from './CopilotOpportunity'

export interface CopilotRequest {
    id: number,
    projectId: string,
    projectType: ProjectType,
    complexity: 'high' | 'medium' | 'low',
    copilotUsername: string,
    numHoursPerWeek: number,
    numWeeks: number,
    overview: string,
    opportunityTitle: string,
    paymentType: string,
    otherPaymentType: string,
    requiresCommunication: 'yes' | 'no',
    skills: UserSkill[],
    startDate: Date,
    status: string,
    tzRestrictions: 'yes' | 'no',
    createdAt: Date,
    opportunity?: CopilotOpportunity,
    project?: {
        name: string,
    },
}
