/* eslint-disable sort-keys */
import type {
    AppConfig,
    FlowConfig,
    FlowStep,
    FlowVariant,
    ViewState,
} from './types'

/**
 * Describes a QA flow variant and the steps rendered for it.
 */
export interface FlowDefinition {
    key: FlowVariant
    tabLabel: string
    steps: FlowStep[]
    defaultToStep: string
}

/**
 * Color palette used to visually distinguish QA flow variants.
 */
export interface FlowTheme {
    accent: string
    accentSoft: string
    accentStrong: string
}

const fullSteps: FlowStep[] = [
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

const first2FinishSteps: FlowStep[] = [
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

const topgearLateSteps: FlowStep[] = [
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

const designSingleSteps: FlowStep[] = [
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

const designSteps: FlowStep[] = [
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

/**
 * Ordered list of flow keys rendered in the selector.
 */
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

/**
 * Flow metadata keyed by runner variant.
 */
export const FLOW_DEFINITIONS: Record<FlowVariant, FlowDefinition> = {
    full: {
        key: 'full',
        tabLabel: 'Full Challenge',
        steps: fullSteps,
        defaultToStep: 'activate',
    },
    design: {
        key: 'design',
        tabLabel: 'Design Challenge',
        steps: designSteps,
        defaultToStep: 'activate',
    },
    designFailScreening: {
        key: 'designFailScreening',
        tabLabel: 'Design Challenge (Fail screening)',
        steps: designSteps,
        defaultToStep: 'activate',
    },
    designFailReview: {
        key: 'designFailReview',
        tabLabel: 'Design Challenge (Fail review)',
        steps: designSteps,
        defaultToStep: 'activate',
    },
    designSingle: {
        key: 'designSingle',
        tabLabel: 'Design Challenge - Single',
        steps: designSingleSteps,
        defaultToStep: 'activate',
    },
    first2finish: {
        key: 'first2finish',
        tabLabel: 'First2Finish',
        steps: first2FinishSteps,
        defaultToStep: 'loadInitialSubmissions',
    },
    topgear: {
        key: 'topgear',
        tabLabel: 'Topgear Task',
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
        defaultToStep: 'loadInitialSubmissions',
    },
    topgearLate: {
        key: 'topgearLate',
        tabLabel: 'Topgear Task (Late)',
        steps: topgearLateSteps,
        defaultToStep: 'loadInitialSubmissions',
    },
}

/**
 * Theme colors for each flow variant.
 */
export const FLOW_THEME_BY_VARIANT: Record<FlowVariant, FlowTheme> = {
    full: {
        accent: '#2563eb',
        accentSoft: '#dbeafe',
        accentStrong: '#1d4ed8',
    },
    design: {
        accent: '#ea580c',
        accentSoft: '#ffedd5',
        accentStrong: '#c2410c',
    },
    designFailScreening: {
        accent: '#ea580c',
        accentSoft: '#ffedd5',
        accentStrong: '#c2410c',
    },
    designFailReview: {
        accent: '#ea580c',
        accentSoft: '#ffedd5',
        accentStrong: '#c2410c',
    },
    designSingle: {
        accent: '#ea580c',
        accentSoft: '#ffedd5',
        accentStrong: '#c2410c',
    },
    first2finish: {
        accent: '#047857',
        accentSoft: '#d1fae5',
        accentStrong: '#065f46',
    },
    topgear: {
        accent: '#7c3aed',
        accentSoft: '#ede9fe',
        accentStrong: '#5b21b6',
    },
    topgearLate: {
        accent: '#dc2626',
        accentSoft: '#fee2e2',
        accentStrong: '#b91c1c',
    },
}

/**
 * Resolves the config branch used by the active flow.
 *
 * @param config Persisted QA app config.
 * @param flow Active QA flow.
 * @returns Flow-specific config payload.
 */
export function getFlowConfig(config: AppConfig, flow: FlowVariant): FlowConfig {
    switch (flow) {
        case 'full':
            return config.fullChallenge
        case 'design':
            return config.designChallenge
        case 'designSingle':
            return config.designSingleChallenge
        case 'designFailScreening':
            return config.designFailScreeningChallenge
        case 'designFailReview':
            return config.designFailReviewChallenge
        case 'first2finish':
            return config.first2finish
        case 'topgear':
        case 'topgearLate':
            return config.topgear
        default:
            return config.fullChallenge
    }
}

/**
 * Resolves the persisted app-config key for the provided QA flow variant.
 *
 * @param flow Active QA flow.
 * @returns Matching persisted config branch key.
 */
export function flowVariantToConfigKey(flow: FlowVariant): keyof AppConfig {
    switch (flow) {
        case 'full':
            return 'fullChallenge'
        case 'design':
            return 'designChallenge'
        case 'designSingle':
            return 'designSingleChallenge'
        case 'designFailScreening':
            return 'designFailScreeningChallenge'
        case 'designFailReview':
            return 'designFailReviewChallenge'
        case 'first2finish':
            return 'first2finish'
        case 'topgear':
        case 'topgearLate':
            return 'topgear'
        default:
            return 'fullChallenge'
    }
}

/**
 * Builds the per-flow page view state map.
 *
 * @returns Initial view state for every supported flow.
 */
export function createInitialViewState(): Record<FlowVariant, ViewState> {
    return ORDERED_FLOW_KEYS.reduce<Record<FlowVariant, ViewState>>((acc, key) => {
        acc[key] = 'home'
        return acc
    }, {} as Record<FlowVariant, ViewState>)
}

/**
 * Builds the per-flow "run to step" selection state map.
 *
 * @returns Default target step for every supported flow.
 */
export function createInitialToStepState(): Record<FlowVariant, string> {
    return ORDERED_FLOW_KEYS.reduce<Record<FlowVariant, string>>((acc, key) => {
        acc[key] = FLOW_DEFINITIONS[key].defaultToStep
        return acc
    }, {} as Record<FlowVariant, string>)
}
