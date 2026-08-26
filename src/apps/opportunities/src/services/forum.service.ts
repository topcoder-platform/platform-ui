import { EnvironmentConfig } from '~/config'
import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrPatchAsync,
    xhrPostAsync,
    xhrPutAsync,
} from '~/libs/core'

import {
    CreateForumPostRequest,
    CreateForumTopicRequest,
    CreateForumTopicResponse,
    ForumPostMutationResponse,
    ForumTopicCollection,
    ForumTopicDetail,
    ForumTopicMutationResponse,
    ForumTopicPage,
    ForumWatchMutationResponse,
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

/**
 * Creates a challenge-scoped topic and its starter post with the member token.
 *
 * @param request validated topic title, markdown content, and challenge ID.
 * @returns transactional topic and starter-post response.
 * @throws Propagates Forums API authentication, access, validation, and network errors.
 */
export function createForumTopic(
    request: CreateForumTopicRequest,
): Promise<CreateForumTopicResponse> {
    return xhrPostAsync<CreateForumTopicRequest, CreateForumTopicResponse>(
        `${FORUMS_URL}/topics`,
        request,
    )
}

/**
 * Updates the title of an owned or moderated forum topic.
 *
 * @param topicId Forums API topic identifier.
 * @param title non-empty replacement title.
 * @returns updated topic mutation response.
 * @throws Propagates Forums API ownership, lock, validation, and network errors.
 */
export function updateForumTopic(
    topicId: string,
    title: string,
): Promise<ForumTopicMutationResponse> {
    return xhrPatchAsync<{ title: string }, ForumTopicMutationResponse>(
        `${FORUMS_URL}/topics/${encodeURIComponent(topicId)}`,
        { title },
    )
}

/**
 * Soft-deletes an owned or moderated forum topic.
 *
 * @param topicId Forums API topic identifier.
 * @returns deleted topic mutation response.
 * @throws Propagates Forums API ownership, lock, not-found, and network errors.
 */
export function deleteForumTopic(topicId: string): Promise<ForumTopicMutationResponse> {
    return xhrDeleteAsync<ForumTopicMutationResponse>(
        `${FORUMS_URL}/topics/${encodeURIComponent(topicId)}`,
    )
}

/**
 * Creates a top-level comment or reply in a visible forum topic.
 *
 * @param topicId Forums API topic identifier.
 * @param request markdown content and optional reply parent.
 * @returns persisted post mutation response.
 * @throws Propagates Forums API access, lock, validation, and network errors.
 */
export function createForumPost(
    topicId: string,
    request: CreateForumPostRequest,
): Promise<ForumPostMutationResponse> {
    return xhrPostAsync<CreateForumPostRequest, ForumPostMutationResponse>(
        `${FORUMS_URL}/topics/${encodeURIComponent(topicId)}/posts`,
        request,
    )
}

/**
 * Updates markdown content on an owned or moderated forum post.
 *
 * @param postId Forums API post identifier.
 * @param content non-empty replacement markdown.
 * @returns updated post mutation response.
 * @throws Propagates Forums API ownership, lock, validation, and network errors.
 */
export function updateForumPost(
    postId: string,
    content: string,
): Promise<ForumPostMutationResponse> {
    return xhrPatchAsync<{ content: string }, ForumPostMutationResponse>(
        `${FORUMS_URL}/posts/${encodeURIComponent(postId)}`,
        { content },
    )
}

/**
 * Soft-deletes an owned or moderated forum post while preserving its thread placeholder.
 *
 * @param postId Forums API post identifier.
 * @returns deleted post mutation response.
 * @throws Propagates Forums API ownership, lock, not-found, and network errors.
 */
export function deleteForumPost(postId: string): Promise<ForumPostMutationResponse> {
    return xhrDeleteAsync<ForumPostMutationResponse>(
        `${FORUMS_URL}/posts/${encodeURIComponent(postId)}`,
    )
}

/**
 * Adds or removes the current member's explicit topic watch.
 *
 * @param topicId Forums API topic identifier.
 * @param watching true to watch or false to unwatch.
 * @returns persisted watch row or resulting watch state.
 * @throws Propagates Forums API access, ban, not-found, and network errors.
 */
export function setForumTopicWatching(
    topicId: string,
    watching: boolean,
): Promise<ForumWatchMutationResponse> {
    const url = `${FORUMS_URL}/topics/${encodeURIComponent(topicId)}/watch`
    return watching
        ? xhrPutAsync<Record<string, never>, ForumWatchMutationResponse>(url, {})
        : xhrDeleteAsync<ForumWatchMutationResponse>(url)
}

/**
 * Marks all current topic activity as read for the authenticated member.
 *
 * @param topicId Forums API topic identifier.
 * @returns completion after the read-state upsert succeeds.
 * @throws Propagates Forums API access, ban, not-found, and network errors.
 */
export async function markForumTopicRead(topicId: string): Promise<void> {
    await xhrPutAsync<Record<string, never>, unknown>(
        `${FORUMS_URL}/topics/${encodeURIComponent(topicId)}/read-state`,
        {},
    )
}
