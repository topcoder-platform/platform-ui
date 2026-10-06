import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'
import { ForumTopicPage, ForumTopicSummary } from '~/apps/opportunities/src/models/forum.models'

export interface PublicForumCategory extends ForumTopicSummary {
    canCreate: boolean
    description: string
    displayAs: 'Categories' | 'Discussions'
    sortOrder: number
    topicsCount: number
}

/** Fetches the category tree and aggregates already filtered for the current identity.
 * @returns Visible category cards. @throws API/network errors.
 */
export function getPublicForumCategories(): Promise<PublicForumCategory[]> {
    return xhrGetAsync(`${EnvironmentConfig.API.V6}/forums/public/categories`)
}

/** Fetches one server-paginated thread/search/watch page.
 * @param query Encoded page, category, search, sort and watching filters.
 * @returns Authorized thread page. @throws API/network errors.
 */
export function getPublicForumTopics(query: string): Promise<ForumTopicPage> {
    return xhrGetAsync(`${EnvironmentConfig.API.V6}/forums/public/topics?${query}`)
}
