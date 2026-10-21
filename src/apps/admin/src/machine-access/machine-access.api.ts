import { authInitializeAsync } from '~/libs/core'

import { machineAccessApi, machineAccessEnabled } from './config'

export interface MachineClient {
    clientId: string
    name: string
    owner: string
    description: string
    enabled: boolean
    state: 'ready' | 'pending' | 'failed'
    revision: number
    appliedRevision: number
    allowedScopes: string[]
    defaultScopes: string[]
    lastIssuedAt?: string
    credentialCreatedAt?: string
    retireAt?: string
    replacedBy?: string
    replaces?: string
}

export interface MachineScope {
    name: string
    description: string
    owner: string
    state: string
    revision: number
}

export interface MachineAudit {
    id: string
    createdAt: string
    actor: string
    action: string
    target: string
    reason: string
    state: string
}

export interface MachinePage<T> {
    items: T[]
    next: string | null
}

export interface MachineOperation {
    operation: { state: string }
    clientId?: string
    secret?: string | null
    replay?: boolean
}

/**
 * Call the fixed DEV backend with the existing member bearer token.
 * @param path Relative admin resource path, never a caller-selected origin.
 * @param method HTTP method; GET by default.
 * @param data Optional secret-free mutation with reason/revision.
 * @param operationKey Stable idempotency key retained across uncertain retries.
 * @returns Parsed response; credentials remain only in caller memory.
 * @throws Sanitized errors for disabled environment, missing login, network or API failure.
 */
export async function machineRequest<T>(
    path: string,
    method?: 'GET' | 'POST' | 'PUT',
    data?: unknown,
    operationKey?: string,
): Promise<T> {
    if (!machineAccessEnabled || !/^(clients|scopes|audit)(\/|\?|$)/.test(path)) {
        throw new Error('Machine Access is available only in DEV.')
    }

    const token = await authInitializeAsync()
    if (!token) throw new Error('Sign in as an Administrator to continue.')
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 20000)
    try {
        const response = await fetch(`${machineAccessApi}/${path}`, {
            body: data === undefined ? undefined : JSON.stringify(data),
            cache: 'no-store',
            credentials: 'omit',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...(operationKey ? { 'Idempotency-Key': operationKey } : {}),
            },
            method: method ?? 'GET',
            redirect: 'error',
            signal: controller.signal,
        })
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('An authenticated Administrator account is required.')
            }

            if (response.status === 409) {
                throw new Error('This record or operation changed. Refresh before trying again.')
            }

            if (response.status === 400) {
                throw new Error('Check the client ID, required fields, and allowed/default scopes.')
            }

            throw new Error(
                'The operation could not complete. Refresh to check its status before retrying.',
            )
        }

        return (await response.json()) as T
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('An authenticated')) throw error
        if (error instanceof Error && /^(This record|Check the|The operation)/.test(error.message)) throw error
        throw new Error(
            'The DEV backend is unavailable. Refresh to check the operation status before retrying.',
        )
    } finally {
        window.clearTimeout(timeout)
    }
}
