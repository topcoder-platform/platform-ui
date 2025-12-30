import type { AppConfig, FlowConfigUnion, FlowVariant } from '../types'
import { validateAppConfig } from '../models/config.models'
import defaults from '../../config/defaults.json'

export const TESTER_CONFIG_STORAGE_KEY = 'testerAppConfig'
export const TESTER_CONFIG_VERSION = '1.0'

type StoredConfig = {
    version: string
    config: Partial<AppConfig>
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && Boolean(value) && !Array.isArray(value)
)

const cloneConfig = <T>(value: T): T => {
    if (typeof globalThis.structuredClone === 'function') {
        return globalThis.structuredClone(value)
    }

    return JSON.parse(JSON.stringify(value)) as T
}

const getStorage = (): Storage | undefined => {
    if (typeof window === 'undefined') {
        return undefined
    }

    try {
        return window.localStorage
    } catch {
        return undefined
    }
}

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

const mergeObjects = <T extends Record<string, any>>(
    base: T,
    overrides: Partial<T>,
): T => {
    const result: Record<string, any> = { ...base }

    Object.entries(overrides)
        .forEach(([key, value]) => {
            if (value === undefined) {
                return
            }

            if (Array.isArray(value)) {
                result[key] = value.slice()
                return
            }

            if (isRecord(value) && isRecord(result[key])) {
                result[key] = mergeObjects(result[key], value)
                return
            }

            result[key] = value
        })

    return result as T
}

const mergeFlowConfig = (
    base: Partial<FlowConfigUnion> | undefined,
    updates: Partial<FlowConfigUnion>,
): Partial<FlowConfigUnion> => (
    mergeObjects((base ?? {}) as Record<string, any>, updates as Record<string, any>)
)

export const mergeConfigs = (defaultsConfig: AppConfig, userOverrides: Partial<AppConfig>): AppConfig => (
    mergeObjects(cloneConfig(defaultsConfig), userOverrides)
)

export const loadDefaultConfig = (): AppConfig => (defaults as AppConfig)

export const isValidConfig = (data: unknown): data is StoredConfig => (
    isRecord(data)
    && typeof data.version === 'string'
    && isRecord(data.config)
)

export const migrateConfigVersion = (data: any): AppConfig => {
    if (isRecord(data) && isRecord(data.config)) {
        return data.config as AppConfig
    }

    if (isRecord(data)) {
        return data as AppConfig
    }

    return {} as AppConfig
}

export const loadUserConfig = (): Partial<AppConfig> | undefined => {
    const storage = getStorage()

    if (!storage) {
        return undefined
    }

    try {
        const rawValue = storage.getItem(TESTER_CONFIG_STORAGE_KEY)

        if (!rawValue) {
            return undefined
        }

        const parsed = JSON.parse(rawValue)
        let candidate: Partial<AppConfig> | undefined

        if (isValidConfig(parsed)) {
            candidate = parsed.version !== TESTER_CONFIG_VERSION
                ? migrateConfigVersion(parsed)
                : (parsed.config ?? {})
        } else if (isRecord(parsed)) {
            candidate = migrateConfigVersion(parsed)
        }

        if (!candidate) {
            return undefined
        }

        const mergedConfig = mergeConfigs(loadDefaultConfig(), candidate)

        if (!validateAppConfig(mergedConfig)) {
            return undefined
        }

        return candidate
    } catch {
        return undefined
    }

    return undefined
}

export const saveUserConfig = (config: Partial<AppConfig>): void => {
    const storage = getStorage()

    if (!storage) {
        return
    }

    try {
        const payload: StoredConfig = {
            config,
            version: TESTER_CONFIG_VERSION,
        }
        storage.setItem(TESTER_CONFIG_STORAGE_KEY, JSON.stringify(payload))
    } catch {}
}

export const clearUserConfig = (): void => {
    const storage = getStorage()

    if (!storage) {
        return
    }

    try {
        storage.removeItem(TESTER_CONFIG_STORAGE_KEY)
    } catch {}
}

export const getFlowUserConfig = (flow: FlowVariant): Partial<FlowConfigUnion> | undefined => {
    const userConfig = loadUserConfig()

    if (!userConfig) {
        return undefined
    }

    const key = getFlowConfigKey(flow)
    const flowConfig = userConfig[key]

    return flowConfig ? (flowConfig as Partial<FlowConfigUnion>) : undefined
}

export const saveFlowUserConfig = (flow: FlowVariant, config: Partial<FlowConfigUnion>): void => {
    const userConfig = loadUserConfig() ?? {}
    const key = getFlowConfigKey(flow)
    const existingFlowConfig = userConfig[key] as Partial<FlowConfigUnion> | undefined

    const mergedFlowConfig = mergeFlowConfig(existingFlowConfig, config)

    saveUserConfig({
        ...userConfig,
        [key]: mergedFlowConfig,
    })
}

export const resetFlowConfig = (flow: FlowVariant): void => {
    const userConfig = loadUserConfig()

    if (!userConfig) {
        return
    }

    const key = getFlowConfigKey(flow)
    const nextConfig = { ...userConfig }

    delete (nextConfig as Record<string, unknown>)[key]

    if (Object.keys(nextConfig).length === 0) {
        clearUserConfig()
        return
    }

    saveUserConfig(nextConfig)
}
