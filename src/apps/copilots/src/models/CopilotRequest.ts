import { UserSkill } from '~/libs/core'

import { ProjectType } from '../constants'

export interface CopilotRequest {
    id: number,
    projectId: string,
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
    status: string,
    tzRestrictions: 'yes' | 'no',
    createdAt: Date,
}
