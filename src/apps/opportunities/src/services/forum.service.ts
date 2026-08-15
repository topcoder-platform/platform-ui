import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import {
    ForumTopicCollection,
    ForumTopicDetail,
    ForumTopicPage,
} from '../models'

const FORUMS_URL = `${EnvironmentConfig.API.V6}/forums`
const DEFAULT_FORUM_PAGE_SIZE = 100
const MAX_FORUM_PAGES = 20
const FORUM_PAGE_BATCH_SIZE = 4

/**
 * Builds the authenticated Forums API URL for a challenge topic page.
 *
 * @param challengeId Challenge whose visible root topics should be loaded.
 * @param page one-based API page number.
 * @param perPage number of summaries requested from the API.
 * @returns absolute Forums API URL.
 * @throws Does not throw.
 */
export function challengeForumTopicsUrl(
    challengeId: string,
    page: number = 1,
    perPage: number = 100,
): string {
    const url = new URL(`${FORUMS_URL}/topics/challenges/${encodeURIComponent(challengeId)}`)
    url.searchParams.set('page', String(Math.max(1, page)))
    url.searchParams.set('perPage', String(Math.max(1, perPage)))
    return url.toString()
}

/**
 * Loads one API page within the public collection method's bounded contract.
 *
 * @param challengeId challenge whose topics are requested.
 * @param page one-based Forums API page.
 * @param perPage bounded page size.
 * @returns visible topic page and source pagination metadata.
 * @throws Propagates Forums API and network errors.
 */
function getChallengeForumTopicPage(
    challengeId: string,
    page: number,
    perPage: number,
): Promise<ForumTopicPage> {
    return xhrGetAsync<ForumTopicPage>(challengeForumTopicsUrl(challengeId, page, perPage))
}

/**
 * Loads every reported page of visible challenge topics up to a defensive cap.
 * Pages are requested in small batches, de-duplicated by topic id, and marked
 * as truncated when the service reports more than the cap. This keeps local
 * search, filters, counts, and pagination honest without permitting an
 * unbounded burst of authenticated requests.
 *
 * @param challengeId Challenge whose visible root topics should be loaded.
 * @param perPage number of summaries requested from each Forums API page.
 * @param maxPages maximum number of reported pages to aggregate.
 * @returns bounded topic collection and source-count/truncation metadata.
 * @throws Propagates authentication, authorization, validation, and network errors.
 */
export async function getChallengeForumTopics(
    challengeId: string,
    perPage: number = DEFAULT_FORUM_PAGE_SIZE,
    maxPages: number = MAX_FORUM_PAGES,
): Promise<ForumTopicCollection> {
    const normalizedPerPage = Math.max(1, perPage)
    const normalizedMaxPages = Math.max(1, maxPages)
    const firstPage = await getChallengeForumTopicPage(challengeId, 1, normalizedPerPage)
    const reportedPages = Math.max(firstPage.meta.totalPages, firstPage.data.length ? 1 : 0)
    const pagesToLoad = Math.min(reportedPages, normalizedMaxPages)
    const pages: ForumTopicPage[] = [firstPage]

    for (let page = 2; page <= pagesToLoad; page += FORUM_PAGE_BATCH_SIZE) {
        const pageNumbers = Array.from(
            { length: Math.min(FORUM_PAGE_BATCH_SIZE, pagesToLoad - page + 1) },
            (_, index) => page + index,
        )
        // A small batch avoids serial latency without producing an unbounded request fan-out.
        // eslint-disable-next-line no-await-in-loop
        pages.push(...await Promise.all(
            pageNumbers.map(pageNumber => getChallengeForumTopicPage(
                challengeId,
                pageNumber,
                normalizedPerPage,
            )),
        ))
    }

    const topics = pages.flatMap(page => page.data)
        .filter((topic, index, allTopics) => allTopics.findIndex(candidate => candidate.id === topic.id) === index)
    return {
        data: topics,
        sourceTotalCount: firstPage.meta.totalCount,
        truncated: reportedPages > normalizedMaxPages,
    }
}

/**
 * Loads a visible topic and its nested post tree using the current member token.
 *
 * @param topicId Forums API topic identifier.
 * @returns topic summary and nested visible/deleted-placeholder post tree.
 * @throws Propagates authentication, authorization, not-found, and network errors.
 */
export function getForumTopicDetail(topicId: string): Promise<ForumTopicDetail> {
    return xhrGetAsync<ForumTopicDetail>(
        `${FORUMS_URL}/topics/${encodeURIComponent(topicId)}`,
    )
}
