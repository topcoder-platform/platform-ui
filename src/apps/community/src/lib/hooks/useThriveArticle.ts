import useSWR, { SWRResponse } from 'swr'

import { ThriveArticle } from '../models'
import { fetchThriveArticleBySlug } from '../services'

export interface UseThriveArticleResult {
    article: ThriveArticle | undefined
    isLoading: boolean
}

/**
 * Fetches one Thrive article by slug.
 *
 * @param slug Thrive article slug from route params.
 * @returns Article and loading status.
 */
export function useThriveArticle(
    slug: string | undefined,
): UseThriveArticleResult {
    const {
        data: article,
        isValidating: isLoading,
    }: SWRResponse<ThriveArticle | undefined, Error> = useSWR<ThriveArticle | undefined, Error>(
        slug ? `thrive/article/${slug}` : undefined,
        {
            fetcher: () => fetchThriveArticleBySlug(slug ?? ''),
        },
    )

    return {
        article,
        isLoading,
    }
}
