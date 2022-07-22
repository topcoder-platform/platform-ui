import { WorkProgress } from './work-progress.model'
import { WorkStatus } from './work-status.enum'
import { WorkTypeCategory } from './work-type-category.enum'
import { WorkType } from './work-type.enum'

export interface Work {
    cost?: number
    created: Date
    description?: string
    draftStep?: string
    id: string
    messageCount?: number
    participantsCount?: number
    progress: WorkProgress
    solutionsCount?: number
    solutionsReadyDate?: Date
    status: WorkStatus
    submittedDate?: Date
    title: string
    type: WorkType
    typeCategory: WorkTypeCategory
}
