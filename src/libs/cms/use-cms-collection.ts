import { useEffect, useMemo, useState } from 'react'

import { payloadCmsClient, serializeCmsQuery } from './cms.client'
import { CmsCollection, CmsQuery, CmsRequestError, CmsSpace } from './cms.types'

/** State returned while a Payload CMS collection is loaded. */
export interface CmsCollectionState<Fields extends Record<string, unknown>> {
    data?: CmsCollection<Fields>
    error?: CmsRequestError
    loading: boolean
}

/**
 * Loads a Payload CMS collection and cancels stale work when route filters change.
 *
 * @param space migrated CMS space to query.
 * @param query Contentful-compatible query parameters.
 * @param enabled false to defer the request until required route state is available.
 * @returns current collection, error, and loading state.
 * @throws Does not throw; failures are returned through state.
 */
export function useCmsCollection<Fields extends Record<string, unknown>>(
    space: CmsSpace,
    query: CmsQuery,
    enabled: boolean = true,
): CmsCollectionState<Fields> {
    const queryString = useMemo(() => serializeCmsQuery(query), [query])
    const [state, setState] = useState<CmsCollectionState<Fields>>({ loading: enabled })

    useEffect(() => {
        if (!enabled) {
            setState({ loading: false })
            return undefined
        }

        const controller = new AbortController()
        setState({ loading: true })
        payloadCmsClient.queryEntries<Fields>(space, Object.fromEntries(
            new URLSearchParams(queryString)
                .entries(),
        ), { signal: controller.signal })
            .then(data => setState({ data, loading: false }))
            .catch(error => {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return
                }

                setState({
                    error: error instanceof CmsRequestError
                        ? error
                        : new CmsRequestError('Payload CMS request failed.', 0),
                    loading: false,
                })
            })

        return () => controller.abort()
    }, [enabled, queryString, space])

    return state
}
