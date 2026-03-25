/**
 * Low-level HTTP helper for the arena-manager api.
 *
 * The arena-manager frontend now talks to the dedicated ai-arena-api service
 * under /v6 and forwards the existing platform token/session.
 *
 * All methods return a typed Promise or throw on HTTP/network errors.
 */
import { tokenGetAsync, TokenModel, xhrCreateInstance } from '~/libs/core'

import { ResponseObject } from '../models'

export const ARENA_API_BASE = '/v6'

async function getSessionToken(): Promise<string | undefined> {
    try {
        const token: TokenModel | undefined = await tokenGetAsync()
        return token?.token
    } catch {
        return undefined
    }
}

async function buildHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
    const token = await getSessionToken()

    const authHeaders: Record<string, string> = token
        ? {
            Authorization: `Bearer ${token}`,
            sessionId: token,
        }
        : {}

    return {
        ...authHeaders,
        ...extra,
    }
}

/**
 * JSON-body API call (GET / POST / PUT with JSON).
 */
export async function arenaApiRequest<T>(
    method: string,
    path: string,
    body?: unknown,
): Promise<ResponseObject<T>> {
    const url = `${ARENA_API_BASE}${path}`
    const headers = await buildHeaders()
    const instance = xhrCreateInstance()
    const response = await instance.request<ResponseObject<T>>({
        data: body,
        headers,
        method,
        url,
    })
    return response.data
}

/**
 * Binary (octet-stream) upload for problem ZIP files.
 */
export async function arenaApiUploadBinary<T>(
    path: string,
    file: File,
    problemName?: string,
): Promise<ResponseObject<T>> {
    const headers = await buildHeaders({
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Type': 'application/octet-stream',
    })
    if (problemName) {
        headers['X-Problem-Name'] = problemName
    }

    const instance = xhrCreateInstance()
    const response = await instance.request<ResponseObject<T>>({
        data: file,
        headers,
        method: 'POST',
        url: `${ARENA_API_BASE}${path}`,
    })
    return response.data
}
