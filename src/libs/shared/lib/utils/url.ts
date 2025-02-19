import qs from 'qs'

/**
 * Constructs a URL from a base string and options containing query parameters and hash fragments.
 * @param base The base URL.
 * @param options An object containing query parameters and hash fragments.
 * @returns The constructed URL.
 */
type QueryEntries = {[key: string]: string | undefined};

export const buildUrl = (base: string, query?: QueryEntries, hash?: QueryEntries): string => {
    let constructedUrl = base

    const queryParams = qs.stringify(query)
    if (queryParams.length) {
        constructedUrl += `?${queryParams}`
    }

    const hashParams = qs.stringify(hash)
    if (hashParams.length) {
        constructedUrl += `#${hashParams}`
    }

    return constructedUrl
}
