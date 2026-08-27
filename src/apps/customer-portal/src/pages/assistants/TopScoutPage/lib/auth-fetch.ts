import { tokenGetAsync, TokenModel } from '~/libs/core'

/**
 * `ai`'s DefaultChatTransport uses raw `fetch`, bypassing the axios instance
 * (and its auth interceptor) the rest of the app relies on — so the bearer
 * token is attached here instead, refetched per request the same way
 * `interceptAuth` does for axios.
 */
export const authFetch: typeof fetch = async (input, init) => {
    const tokenData: TokenModel = await tokenGetAsync()
    const headers = new Headers(init?.headers)

    if (tokenData.token) {
        headers.set('Authorization', `Bearer ${tokenData.token}`)
    }

    return fetch(input, { ...init, headers })
}
