/**
 * Context provider for tester app
 */
import {
    FC,
    PropsWithChildren,
    useCallback,
    useMemo,
    useState,
} from 'react'

import { tokenGetAsync, TokenModel } from '~/libs/core'
import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'

import type { AppConfig, FlowConfigUnion, FlowVariant } from '../types'
import { getFlowConfig as getFlowConfigByVariant } from '../flows'
import {
    clearUserConfig,
    loadDefaultConfig,
    loadUserConfig,
    mergeConfigs,
    resetFlowConfig as resetFlowConfigStorage,
    saveFlowUserConfig,
} from '../utils'

import { TesterAppContext } from './TesterAppContext'

const getFlowConfigKey = (flow: FlowVariant): keyof AppConfig => {
    switch (flow) {
        case 'full':
            return 'fullChallenge'
        case 'first2finish':
            return 'first2finish'
        case 'topgear':
            return 'topgear'
        case 'topgearLate':
            return 'topgear'
        case 'design':
            return 'designChallenge'
        case 'designFailScreening':
            return 'designFailScreeningChallenge'
        case 'designFailReview':
            return 'designFailReviewChallenge'
        case 'designSingle':
            return 'designSingleChallenge'
        default:
            return 'fullChallenge'
    }
}

const buildConfigState = (): AppConfig => {
    const defaults = loadDefaultConfig()
    const userOverrides = loadUserConfig() ?? {}

    return mergeConfigs(defaults, userOverrides)
}

export const TesterAppContextProvider: FC<PropsWithChildren> = props => {
    const [loginUserInfo, setLoginUserInfo] = useState<TokenModel | undefined>(undefined)
    const [config, setConfig] = useState<AppConfig>(() => buildConfigState())
    const [isConfigLoaded, setIsConfigLoaded] = useState(false)

    const getFlowConfig = useCallback(
        (flow: FlowVariant) => getFlowConfigByVariant(config, flow),
        [config],
    )

    const updateFlowConfig = useCallback(
        (flow: FlowVariant, updates: Partial<FlowConfigUnion>) => {
            setConfig(prevConfig => {
                const key = getFlowConfigKey(flow)
                const currentConfig = prevConfig[key] as FlowConfigUnion

                return {
                    ...prevConfig,
                    [key]: {
                        ...currentConfig,
                        ...updates,
                    },
                }
            })

            saveFlowUserConfig(flow, updates)
        },
        [],
    )

    const resetFlowConfig = useCallback((flow: FlowVariant) => {
        resetFlowConfigStorage(flow)
        setConfig(buildConfigState())
    }, [])

    const resetAllConfigs = useCallback(() => {
        clearUserConfig()
        setConfig(loadDefaultConfig())
    }, [])

    const value = useMemo(
        () => ({
            config,
            getFlowConfig,
            isConfigLoaded,
            loginUserInfo,
            resetAllConfigs,
            resetFlowConfig,
            updateFlowConfig,
        }),
        [
            config,
            getFlowConfig,
            isConfigLoaded,
            loginUserInfo,
            resetAllConfigs,
            resetFlowConfig,
            updateFlowConfig,
        ],
    )

    useOnComponentDidMount(() => {
        setConfig(buildConfigState())
        setIsConfigLoaded(true)

        // get login user info on init
        tokenGetAsync()
            .then((token: TokenModel) => {
                setLoginUserInfo(token)
            })
    })

    return (
        <TesterAppContext.Provider value={value}>
            {props.children}
        </TesterAppContext.Provider>
    )
}
