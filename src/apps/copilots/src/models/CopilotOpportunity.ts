import { UserSkill } from '~/libs/core'

import { ProjectType } from '../constants'

export interface CopilotOpportunity {
    id: number,
    copilotRequestId: number,
    status: string,
    type: ProjectType,
    projectId: string,
    projectName: string,
    projectType: ProjectType,
    complexity: 'high' | 'medium' | 'low',
    copilotUsername: string,
    numHoursPerWeek: number,
    numWeeks: number,
    overview: string,
    paymentType: string,
    otherPaymentType: string,
    requiresCommunication: 'yes' | 'no',
    skills: UserSkill[],
    startDate: Date,
    tzRestrictions: 'yes' | 'no',
    createdAt: Date,
}
