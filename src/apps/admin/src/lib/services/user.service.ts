import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

/**
 * Gets the member suggest by handle.
 * @param {string} handle The handle search text.
 */
export const getMemberSuggestionsByHandle = async (
    handle: string,
): Promise<Array<{ handle: string }>> => {
    type v3Response<T> = { result: { content: T } }
    const data = await xhrGetAsync<v3Response<Array<{ handle: string }>>>(
        `${EnvironmentConfig.API.V3}/members/_suggest/${handle}`,
    )
    return data.result.content
}

/**
 * Gets a list of members given a list of handles.
 * @param handles The handle.
 */
export const getMembersByHandle = async (
    handles: string[],
): Promise<Array<{ handle: string }>> => {
    let qs = ''
    handles.forEach(handle => {
        qs += `&handlesLower[]=${handle.toLowerCase()}`
    })

    return xhrGetAsync<Array<{ handle: string }>>(
        `${EnvironmentConfig.API.V5}/members?fields=userId,handle${qs}`,
    )
}
