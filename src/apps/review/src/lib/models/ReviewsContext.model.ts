import { ReactNode } from 'react'

import { AiWorkflow, AiWorkflowRun } from '../hooks'

import { Scorecard } from './Scorecard.model'
import { ChallengeDetailContextModel } from './ChallengeDetailContextModel.model'
import { BackendSubmission } from './BackendSubmission.model'

export interface ReviewCtxStatus {
    status: 'passed' | 'pending' | 'failed-score';
    score: number;
}

export interface ReviewsContextModel extends ChallengeDetailContextModel {
    isLoading: boolean
    reviewId?: string;
    submissionId: string
    workflowId?: string
    workflow?: AiWorkflow
    workflowRun?: AiWorkflowRun
    scorecard?: Scorecard
    workflowRuns: AiWorkflowRun[]
    reviewStatus?: ReviewCtxStatus
    setReviewStatus: (status: ReviewCtxStatus) => void
    actionButtons?: ReactNode
    setActionButtons: (btns?: ReactNode) => void
    submissionInfo?: BackendSubmission
}
