import { AiWorkflow, AiWorkflowRun } from '../hooks'

import { Scorecard } from './Scorecard.model'
import { ChallengeDetailContextModel } from './ChallengeDetailContextModel.model'

export interface ReviewsContextModel extends ChallengeDetailContextModel {
    isLoading: boolean
    reviewId?: string;
    submissionId: string
    workflowId?: string
    workflow?: AiWorkflow
    workflowRun?: AiWorkflowRun
    scorecard?: Scorecard
    workflowRuns: AiWorkflowRun[]
}
