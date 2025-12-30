import type { AppConfig, FlowConfigUnion, FlowStep, FlowVariant } from '../types'

import { type FlowDefinition, FLOW_DEFINITIONS } from './flow-definitions'

export const getFlowConfig = (config: AppConfig, flow: FlowVariant): FlowConfigUnion => {
    switch (flow) {
        case 'full':
            return config.fullChallenge
        case 'first2finish':
            return config.first2finish
        case 'topgear':
            return config.topgear
        case 'topgearLate':
            return config.topgear
        case 'design':
            return config.designChallenge
        case 'designFailScreening':
            return config.designFailScreeningChallenge
        case 'designFailReview':
            return config.designFailReviewChallenge
        case 'designSingle':
            return config.designSingleChallenge
        default:
            return config.fullChallenge
    }
}

export const getFlowDefinition = (flow: FlowVariant): FlowDefinition => FLOW_DEFINITIONS[flow]

export const getFlowSteps = (flow: FlowVariant): FlowStep[] => (
    getFlowDefinition(flow).steps
)

export const getDefaultToStep = (flow: FlowVariant): string => (
    getFlowDefinition(flow).defaultToStep
)
