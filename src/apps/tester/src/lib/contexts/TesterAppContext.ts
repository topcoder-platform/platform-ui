import { createContext } from 'react'

import type { TokenModel } from '~/libs/core'

import type { AppConfig, FlowConfigUnion, FlowVariant } from '../types'

export interface TesterAppContextModel {
    config: AppConfig
    isConfigLoaded: boolean
    getFlowConfig: (flow: FlowVariant) => FlowConfigUnion
    updateFlowConfig: (flow: FlowVariant, updates: Partial<FlowConfigUnion>) => void
    resetFlowConfig: (flow: FlowVariant) => void
    resetAllConfigs: () => void
    loginUserInfo?: TokenModel
}

export const TesterAppContext = createContext<TesterAppContextModel>({} as TesterAppContextModel)
