import { LearnModelBase } from '../../../functions'
import { ResourceProvider } from '../../resource-provider-provider'

import { LearnModuleProgress } from './learn-module-progress.model'
import { UserCertificationProgressStatus } from './user-certification-progress-status.enum'

export interface LearnUserCertificationProgress extends LearnModelBase {
    academicHonestyPolicyAcceptedAt?: number,
    certification: string
    certificationId: string
    certificationProgressPercentage: number
    certType: 'certification'
    completedDate?: string
    courseId: string
    courseKey: string
    courseProgressPercentage: number
    currentLesson?: string
    id: string
    moduleProgresses: Array<LearnModuleProgress>
    resourceProvider: ResourceProvider
    startDate: string
    status: UserCertificationProgressStatus
}
