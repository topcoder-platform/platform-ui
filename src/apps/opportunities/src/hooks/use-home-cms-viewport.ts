import { useMemo } from 'react'

import type { CmsRequestError } from '~/libs/cms'
import { useCmsCollection } from '~/libs/cms'

import { collectHomeCmsBlocks, HomeCmsBlock } from '../utils/home.utils'

/** State returned by `useHomeCmsViewport`. */
export interface HomeCmsViewportState {
    /** Renderable blocks in authored order; empty while loading, after an error, or for an empty viewport. */
    blocks: HomeCmsBlock[]
    /** Payload CMS failure, including a missing `default`-space delivery credential. */
    error?: CmsRequestError
    /** True while the viewport request is in flight. */
    loading: boolean
}

/**
 * Loads one retained dashboard viewport from Payload CMS's `default` space.
 *
 * Used by `HomeCmsViewport`. The query asks Payload for ten levels of
 * includes so nested viewports, sliders, and content blocks arrive in one
 * request; `PayloadCmsClient` resolves those links before the viewport is
 * flattened by `collectHomeCmsBlocks`.
 *
 * @param viewportId retained viewport entry ID; an empty ID skips the request.
 * @returns renderable blocks plus loading and error state.
 * @throws Does not throw; CMS failures are returned in state.
 */
export function useHomeCmsViewport(viewportId: string): HomeCmsViewportState {
    const query = useMemo(() => ({
        include: 10,
        limit: 1,
        'sys.id': viewportId,
    }), [viewportId])
    const collection = useCmsCollection<Record<string, unknown>>('default', query, !!viewportId)
    const blocks = useMemo(
        () => collectHomeCmsBlocks(collection.data?.items[0]),
        [collection.data],
    )

    return {
        blocks,
        error: collection.error,
        loading: collection.loading,
    }
}
