import { AiWorkflow, AiWorkflowRun } from '../hooks'

import { Scorecard } from './Scorecard.model'
import { ChallengeDetailContextModel } from './ChallengeDetailContextModel.model'

export interface AiScorecardContextModel extends ChallengeDetailContextModel {
    isLoading: boolean
    submissionId: string
    workflowId: string
    workflow?: AiWorkflow
    workflowRun?: AiWorkflowRun
    scorecard?: Scorecard
    workflowRuns: AiWorkflowRun[]
    setSubmissionId: (id: string) => void
}
