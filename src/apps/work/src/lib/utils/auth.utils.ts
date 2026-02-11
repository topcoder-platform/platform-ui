import { tokenGetAsync, TokenModel } from '~/libs/core'

let storedAuthToken: TokenModel | undefined

function normalizeTokenModel(tokenData?: TokenModel): TokenModel | undefined {
    if (!tokenData) {
        return undefined
    }

    const accessToken = typeof tokenData.token === 'string'
        ? tokenData.token.trim()
        : ''

    if (!accessToken) {
        return undefined
    }

    return {
        ...tokenData,
        token: accessToken,
    }
}

export function storeAuthToken(tokenData?: TokenModel): TokenModel | undefined {
    storedAuthToken = normalizeTokenModel(tokenData)

    return storedAuthToken
}

export function getStoredAuthToken(): TokenModel | undefined {
    return storedAuthToken
}

export function clearStoredAuthToken(): void {
    storedAuthToken = undefined
}

export async function refreshAuthTokenAsync(): Promise<TokenModel | undefined> {
    try {
        const tokenData = await tokenGetAsync()

        return storeAuthToken(tokenData)
    } catch {
        clearStoredAuthToken()

        return undefined
    }
}

export async function getAuthTokenAsync(): Promise<TokenModel | undefined> {
    if (storedAuthToken?.token) {
        return storedAuthToken
    }

    return refreshAuthTokenAsync()
}

export function getAuthAccessToken(tokenData?: TokenModel): string {
    const normalizedTokenData = tokenData === undefined
        ? storedAuthToken
        : normalizeTokenModel(tokenData)

    return normalizedTokenData?.token || ''
}

export function buildAuthHeaders(
    tokenData?: TokenModel,
    initialHeaders: Record<string, string> = {},
): Record<string, string> {
    const headers: Record<string, string> = {
        ...initialHeaders,
    }
    const accessToken = getAuthAccessToken(tokenData)

    if (!accessToken) {
        return headers
    }

    return {
        ...headers,
        Authorization: `Bearer ${accessToken}`,
    }
}
