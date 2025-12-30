import type { FlowStep, FlowVariant } from '../types'

export interface FlowDefinition {
    key: FlowVariant
    tabLabel: string
    steps: FlowStep[]
    defaultToStep: string
}

export const fullSteps: FlowStep[] = [
    { id: 'token', label: 'Token' },
    { id: 'createChallenge', label: 'Create Challenge' },
    { id: 'updateDraft', label: 'Update Draft' },
    { id: 'activate', label: 'Activate' },
    { id: 'awaitRegSubOpen', label: 'Await Reg/Sub Open' },
    { id: 'assignResources', label: 'Assign Resources' },
    { id: 'createSubmissions', label: 'Create Submissions' },
    { id: 'awaitReviewOpen', label: 'Await Review Open' },
    { id: 'createReviews', label: 'Create Reviews' },
    { id: 'awaitAppealsOpen', label: 'Await Appeals Open' },
    { id: 'createAppeals', label: 'Create Appeals' },
    { id: 'awaitAppealsResponseOpen', label: 'Await Appeals Response Open' },
    { id: 'appealResponses', label: 'Appeal Responses' },
    { id: 'awaitAllClosed', label: 'Await All Closed' },
    { id: 'awaitCompletion', label: 'Await Completion' },
]

export const first2FinishSteps: FlowStep[] = [
    { id: 'token', label: 'Token' },
    { id: 'createChallenge', label: 'Create Challenge' },
    { id: 'updateDraft', label: 'Update Draft' },
    { id: 'activate', label: 'Activate' },
    { id: 'awaitRegSubOpen', label: 'Await Reg/Sub Open' },
    { id: 'assignResources', label: 'Assign Resources' },
    { id: 'loadInitialSubmissions', label: 'Load Submissions' },
    { id: 'processReviews', label: 'Process Reviews' },
    { id: 'finalSubmission', label: 'Final Submission' },
    { id: 'awaitWinner', label: 'Await Winner' },
]

export const topgearLateSteps: FlowStep[] = [
    { id: 'token', label: 'Token' },
    { id: 'createChallenge', label: 'Create Challenge' },
    { id: 'updateDraft', label: 'Update Draft' },
    { id: 'activate', label: 'Activate' },
    { id: 'awaitRegSubOpen', label: 'Await Reg/Sub Open' },
    { id: 'assignResources', label: 'Assign Resources' },
    { id: 'loadInitialSubmissions', label: 'Load Submissions' },
    { id: 'processReviews', label: 'Process Reviews' },
    { id: 'finalSubmission', label: 'Final Submission' },
    { id: 'awaitWinner', label: 'Await Winner' },
]

export const designSingleSteps: FlowStep[] = [
    { id: 'token', label: 'Token' },
    { id: 'createChallenge', label: 'Create Challenge' },
    { id: 'updateDraft', label: 'Update Draft' },
    { id: 'activate', label: 'Activate' },
    { id: 'awaitRegSubOpen', label: 'Await Reg/Sub Open' },
    { id: 'assignResources', label: 'Assign Resources' },
    { id: 'createSubmissions', label: 'Create Submissions' },
    { id: 'awaitScreeningOpen', label: 'Await Screening Open' },
    { id: 'createScreeningReviews', label: 'Complete Screening Reviews' },
    { id: 'awaitReviewOpen', label: 'Await Review Open' },
    { id: 'createReviews', label: 'Create Reviews' },
    { id: 'awaitApprovalOpen', label: 'Await Approval Open' },
    { id: 'createApprovalReview', label: 'Complete Approval Review' },
    { id: 'awaitAllClosed', label: 'Await All Closed' },
    { id: 'awaitCompletion', label: 'Await Completion' },
]

export const designSteps: FlowStep[] = [
    { id: 'token', label: 'Token' },
    { id: 'createChallenge', label: 'Create Challenge' },
    { id: 'updateDraft', label: 'Update Draft' },
    { id: 'activate', label: 'Activate' },
    { id: 'awaitRegCkptOpen', label: 'Await Reg/Checkpoint Open' },
    { id: 'assignResources', label: 'Assign Resources' },
    { id: 'createCheckpointSubmissions', label: 'Create Checkpoint Submissions' },
    { id: 'awaitCheckpointScreeningOpen', label: 'Await Checkpoint Screening Open' },
    { id: 'createCheckpointScreeningReviews', label: 'Create Checkpoint Screening Reviews' },
    { id: 'awaitCheckpointReviewOpen', label: 'Await Checkpoint Review Open' },
    { id: 'createCheckpointReviews', label: 'Create Checkpoint Reviews' },
    { id: 'awaitSubmissionOpen', label: 'Await Submission Open' },
    { id: 'createSubmissions', label: 'Create Submissions' },
    { id: 'awaitScreeningOpen', label: 'Await Screening Open' },
    { id: 'createScreeningReviews', label: 'Create Screening Reviews' },
    { id: 'awaitReviewOpen', label: 'Await Review Open' },
    { id: 'createReviews', label: 'Create Reviews' },
    { id: 'awaitApprovalOpen', label: 'Await Approval Open' },
    { id: 'createApprovalReview', label: 'Create Approval Review' },
    { id: 'awaitAllClosed', label: 'Await All Closed' },
    { id: 'awaitCompletion', label: 'Await Completion' },
]

export const FLOW_DEFINITIONS: Record<FlowVariant, FlowDefinition> = {
    design: {
        defaultToStep: 'activate',
        key: 'design',
        steps: designSteps,
        tabLabel: 'Design Challenge',
    },
    designFailReview: {
        defaultToStep: 'activate',
        key: 'designFailReview',
        steps: designSteps,
        tabLabel: 'Design Challenge (Fail review)',
    },
    designFailScreening: {
        defaultToStep: 'activate',
        key: 'designFailScreening',
        steps: designSteps,
        tabLabel: 'Design Challenge (Fail screening)',
    },
    designSingle: {
        defaultToStep: 'activate',
        key: 'designSingle',
        steps: designSingleSteps,
        tabLabel: 'Design Challenge - Single',
    },
    first2finish: {
        defaultToStep: 'loadInitialSubmissions',
        key: 'first2finish',
        steps: first2FinishSteps,
        tabLabel: 'First2Finish',
    },
    full: {
        defaultToStep: 'activate',
        key: 'full',
        steps: fullSteps,
        tabLabel: 'Full Challenge',
    },
    topgear: {
        defaultToStep: 'loadInitialSubmissions',
        key: 'topgear',
        steps: [
            { id: 'token', label: 'Token' },
            { id: 'createChallenge', label: 'Create Challenge' },
            { id: 'updateDraft', label: 'Update Draft' },
            { id: 'activate', label: 'Activate' },
            { id: 'awaitRegSubOpen', label: 'Await Reg/Sub Open' },
            { id: 'assignResources', label: 'Assign Resources' },
            { id: 'awaitSubmissionEnd', label: 'Wait til after submission end date' },
            { id: 'loadInitialSubmissions', label: 'Load Submissions' },
            { id: 'processReviews', label: 'Process Reviews' },
            { id: 'finalSubmission', label: 'Final Submission' },
            { id: 'awaitWinner', label: 'Await Winner' },
        ],
        tabLabel: 'Topgear Task',
    },
    topgearLate: {
        defaultToStep: 'loadInitialSubmissions',
        key: 'topgearLate',
        steps: topgearLateSteps,
        tabLabel: 'Topgear Task (Late)',
    },
}

export const ORDERED_FLOW_KEYS: FlowVariant[] = [
    'full',
    'design',
    'designSingle',
    'designFailScreening',
    'designFailReview',
    'first2finish',
    'topgear',
    'topgearLate',
]
