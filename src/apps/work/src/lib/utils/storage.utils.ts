import { BETA_MODE_COOKIE_TAG } from '../constants'

export const WORK_STORAGE_KEYS = {
    BETA_MODE: BETA_MODE_COOKIE_TAG,
    CHALLENGE_FILTERS: 'work-challenge-filters',
    PROJECT_FILTERS: 'work-project-filters',
    TAAS_FILTERS: 'work-taas-filters',
} as const

export type WorkStorageKey = typeof WORK_STORAGE_KEYS[keyof typeof WORK_STORAGE_KEYS]

function canUseStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage
}

export function saveToLocalStorage<T>(key: WorkStorageKey | string, value: T): void {
    if (!key || typeof key !== 'string') {
        throw new Error('Key must be a valid string.')
    }

    if (!canUseStorage()) {
        return
    }

    try {
        window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to save to localStorage:', error)
    }
}

export function getFromLocalStorage<T>(key: WorkStorageKey | string): T | undefined {
    if (!key || typeof key !== 'string') {
        throw new Error('Key must be a valid string.')
    }

    if (!canUseStorage()) {
        return undefined
    }

    try {
        const jsonValue = window.localStorage.getItem(key)

        return jsonValue
            ? JSON.parse(jsonValue) as T
            : undefined
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to retrieve from localStorage:', error)
        return undefined
    }
}

export function removeFromLocalStorage(key: WorkStorageKey | string): void {
    if (!key || typeof key !== 'string') {
        throw new Error('Key must be a valid string.')
    }

    if (!canUseStorage()) {
        return
    }

    try {
        window.localStorage.removeItem(key)
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to remove from localStorage:', error)
    }
}

export function isBetaMode(): boolean {
    return getFromLocalStorage<string>(WORK_STORAGE_KEYS.BETA_MODE) === 'true'
}
