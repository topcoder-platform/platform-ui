import { WorkProgressStep } from './work-progress-step.model'

export interface WorkProgress  {
    activeStepIndex: number
    steps: ReadonlyArray<WorkProgressStep>
}
