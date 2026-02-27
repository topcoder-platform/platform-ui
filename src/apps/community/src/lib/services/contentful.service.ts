import axios, { type AxiosInstance } from 'axios'
import qs from 'qs'

import { EnvironmentConfig } from '~/config'

import {
    type BackendContentfulEntry,
    type BackendContentfulIncludes,
    type BackendThriveArticleFields,
    convertContentfulArticle,
    type ThriveArticle,
    type ThriveArticleType,
} from '../models'

type ContentfulQueryPrimitive = boolean | number | string

/**
 * Generic Contentful query object.
 */
export type ContentfulQuery = Record<
    string,
    ContentfulQueryPrimitive | ContentfulQueryPrimitive[] | undefined
>

/**
 * Contentful collection payload used by the community app.
 */
export interface ContentfulCollection {
    items: Array<BackendContentfulEntry<BackendThriveArticleFields>>
    includes?: BackendContentfulIncludes
    limit?: number
    skip?: number
    total?: number
}

/**
 * Parameters for querying Thrive articles.
 */
export interface ThriveArticleParams {
    limit?: number
    phrase?: string
    skip?: number
    sortBy?: 'date' | 'likes'
    tags?: string[]
    track?: string
    type?: ThriveArticleType
}

/**
 * Checks whether a string resembles a Contentful entry id.
 *
 * @param value Candidate identifier.
 * @returns True when the string appears to be an entry id.
 */
function isEntryId(value: string): boolean {
    return /^[A-Za-z0-9]{8,}$/.test(value)
}

function buildThriveQuery(params: ThriveArticleParams): ContentfulQuery {
    const query: ContentfulQuery = {
        content_type: 'article',
        include: 2,
        limit: params.limit ?? 5,
        skip: params.skip ?? 0,
    }

    if (params.phrase) {
        query.query = params.phrase
    }

    if (params.tags?.length) {
        query['fields.tags[all]'] = params.tags.join(',')
    }

    if (params.track) {
        query['fields.trackCategory'] = params.track
    }

    if (params.type) {
        query['fields.type'] = params.type
    }

    query.order = params.sortBy === 'likes'
        ? '-fields.upvotes,-fields.creationDate'
        : '-fields.creationDate'

    return query
}

/**
 * Creates a dedicated axios instance for Contentful API calls.
 *
 * @param spaceId Contentful space id.
 * @param accessToken Contentful access token.
 * @returns Axios instance configured for the target space.
 */
export function createContentfulInstance(
    spaceId: string,
    accessToken: string,
): AxiosInstance {
    const baseUrl = `${EnvironmentConfig.CONTENTFUL.BASE_URL}/spaces/${spaceId}/environments/master`

    return axios.create({
        baseURL: baseUrl,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    })
}

/**
 * Fetches a single entry by id from Contentful.
 *
 * @param entryId Entry identifier.
 * @param spaceId Contentful space id. Defaults to configured default space id.
 * @param accessToken Contentful access token. Defaults to configured default token.
 * @returns Contentful entry payload.
 */
export async function fetchContentfulEntry(
    entryId: string,
    spaceId: string = EnvironmentConfig.CONTENTFUL.SPACE_ID,
    accessToken: string = EnvironmentConfig.CONTENTFUL.ACCESS_TOKEN,
): Promise<unknown> {
    const instance = createContentfulInstance(spaceId, accessToken)
    if (isEntryId(entryId)) {
        try {
            const response = await instance.get(`/entries/${entryId}`)
            return response.data
        } catch (error: unknown) {
            const status = (error as { response?: { status?: number } }).response?.status
            if (status !== 404) {
                throw error
            }
        }
    }

    const queryString = qs.stringify(
        {
            'fields.name': entryId,
            include: 2,
            limit: 1,
        },
        {
            arrayFormat: 'repeat',
            encodeValuesOnly: true,
        },
    )
    const response = await instance.get<ContentfulCollection>(`/entries?${queryString}`)

    return response.data.items[0]
}

/**
 * Fetches entries from Contentful using a query object.
 *
 * @param query Query params.
 * @param spaceId Contentful space id.
 * @param accessToken Contentful access token.
 * @returns Contentful collection payload.
 */
export async function fetchContentfulEntries(
    query: ContentfulQuery,
    spaceId: string,
    accessToken: string,
): Promise<ContentfulCollection> {
    const instance = createContentfulInstance(spaceId, accessToken)
    const queryString = qs.stringify(query, {
        arrayFormat: 'repeat',
        encodeValuesOnly: true,
    })
    const endpoint = queryString ? `/entries?${queryString}` : '/entries'
    const response = await instance.get<ContentfulCollection>(endpoint)

    return response.data
}

/**
 * Fetches Thrive articles from the EDU Contentful space.
 *
 * @param params Thrive query params.
 * @returns Normalized Thrive articles.
 */
export async function fetchThriveArticles(
    params: ThriveArticleParams,
): Promise<ThriveArticle[]> {
    const collection = await fetchContentfulEntries(
        buildThriveQuery(params),
        EnvironmentConfig.CONTENTFUL.EDU_SPACE_ID,
        EnvironmentConfig.CONTENTFUL.EDU_ACCESS_TOKEN,
    )

    return collection.items.map(item => convertContentfulArticle(item, collection.includes))
}

/**
 * Fetches a single Thrive article from the EDU Contentful space by slug.
 *
 * @param slug Thrive article slug.
 * @returns Converted Thrive article when found.
 */
export async function fetchThriveArticleBySlug(
    slug: string,
): Promise<ThriveArticle | undefined> {
    const collection = await fetchContentfulEntries(
        {
            content_type: 'article',
            'fields.slug': slug,
            include: 2,
            limit: 1,
        },
        EnvironmentConfig.CONTENTFUL.EDU_SPACE_ID,
        EnvironmentConfig.CONTENTFUL.EDU_ACCESS_TOKEN,
    )

    if (!collection.items.length) {
        return undefined
    }

    return convertContentfulArticle(collection.items[0], collection.includes)
}

/**
 * Fetches the configured changelog entry from the default Contentful space.
 *
 * @returns Changelog entry payload.
 */
export async function fetchChangelogEntry(): Promise<unknown> {
    return fetchContentfulEntry(
        EnvironmentConfig.CONTENTFUL.CHANGELOG_ENTRY_ID,
        EnvironmentConfig.CONTENTFUL.SPACE_ID,
        EnvironmentConfig.CONTENTFUL.ACCESS_TOKEN,
    )
}
