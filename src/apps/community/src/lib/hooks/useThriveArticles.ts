import useSWR, { SWRResponse } from 'swr'

import { ThriveArticle } from '../models'
import { fetchThriveArticles, ThriveArticleParams } from '../services'

export interface UseThriveArticlesResult {
    articles: ThriveArticle[]
    isLoading: boolean
}

/**
 * Fetches Thrive articles for the provided query params.
 *
 * @param params Thrive article query params.
 * @returns Thrive articles and loading status.
 */
export function useThriveArticles(
    params?: ThriveArticleParams,
): UseThriveArticlesResult {
    const {
        data: articles,
        isValidating: isLoading,
    }: SWRResponse<ThriveArticle[], Error> = useSWR<ThriveArticle[], Error>(
        params ? `thrive/articles/${JSON.stringify(params)}` : undefined,
        {
            fetcher: () => fetchThriveArticles(params as ThriveArticleParams),
        },
    )

    return {
        articles: articles ?? [],
        isLoading,
    }
}
