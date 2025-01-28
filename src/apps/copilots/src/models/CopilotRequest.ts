import { UserSkill } from '~/libs/core'

import { ProjectType } from '../constants'

export interface CopilotRequest {
    projectId: string,
    projectType: ProjectType,
    complexity: 'high' | 'medium' | 'low',
    copilotUsername: string,
    numHoursPerWeek: number,
    numWeeks: number,
    overview: string,
    paymentType: string,   
    requiresCommunicatn: 'yes' | 'no',
    skills: UserSkill[],
    startDate: Date,
    tzRestrictions: 'yes' | 'no',
}