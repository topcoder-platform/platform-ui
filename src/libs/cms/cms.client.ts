import {
    CmsAssetFields,
    CmsCollection,
    CmsQuery,
    CmsRequestError,
    CmsResource,
    CmsSpace,
} from './cms.types'

/** Payload CMS origin selected for the 2026 platform migration. */
export const PAYLOAD_CMS_ORIGIN = 'https://cms.topcoder-dev.com'

/** Payload-managed media origin selected for migrated CMS assets. */
export const PAYLOAD_ASSET_ORIGIN = 'https://assets.topcoder-dev.com'

const CMS_SPACE_IDS: Record<CmsSpace, string> = {
    default: 'b5f1djy59z3a',
    edu: 'piwi0eufbb2g',
    website: 'xooissnm36jt',
}

const CMS_ENVIRONMENTS: Record<CmsSpace, string> = {
    default: 'master',
    edu: 'master',
    website: 'uat',
}

const CMS_ACCESS_TOKENS: Record<CmsSpace, string> = {
    default: process.env.REACT_APP_PAYLOAD_CMS_DEFAULT_ACCESS_TOKEN || '',
    edu: process.env.REACT_APP_PAYLOAD_CMS_EDU_ACCESS_TOKEN || '',
    website: process.env.REACT_APP_PAYLOAD_CMS_WEBSITE_ACCESS_TOKEN || '',
}

/** Options accepted by a Payload CMS compatibility request. */
export interface CmsRequestOptions {
    signal?: AbortSignal
}

/** Runtime configuration for a Payload CMS compatibility client. */
export interface PayloadCmsClientOptions {
    accessTokens?: Partial<Record<CmsSpace, string>>
    fetcher?: typeof fetch
}

/**
 * Serializes a CMS query without the nested query-string conventions used by the retired proxy.
 *
 * @param query field filters, ordering, includes, and pagination values.
 * @returns an encoded query string accepted by Payload's compatibility facade.
 * @throws URIError when a supplied value cannot be encoded by URLSearchParams.
 */
export function serializeCmsQuery(query: CmsQuery = {}): string {
    const parameters = new URLSearchParams()
    Object.keys(query)
        .sort()
        .forEach(key => {
            const value = query[key]
            if (value === undefined) {
                return
            }

            parameters.set(key, Array.isArray(value) ? value.join(',') : String(value))
        })
    return parameters.toString()
}

/**
 * Returns an asset URL only when it is served by the approved Payload media origin.
 *
 * @param value URL returned by a CMS asset field or embedded markdown image.
 * @returns an absolute assets.topcoder-dev.com URL, or undefined for legacy/unsafe origins.
 * @throws Does not throw for malformed input.
 */
export function getPayloadAssetUrl(value: unknown): string | undefined {
    if (typeof value !== 'string' || !value.trim()) {
        return undefined
    }

    try {
        const url = new URL(value.startsWith('//') ? `https:${value}` : value, PAYLOAD_ASSET_ORIGIN)
        return url.origin === PAYLOAD_ASSET_ORIGIN ? url.toString() : undefined
    } catch (error) {
        return undefined
    }
}

/**
 * Prevents rendered CMS links from navigating to unsafe schemes or retired
 * Contentful and Octana hosts.
 *
 * @param value href supplied by CMS-authored markdown.
 * @returns the original safe link, or undefined when its scheme/host is blocked.
 * @throws Does not throw for relative or malformed links.
 */
export function getSafeCmsLink(value: string | undefined): string | undefined {
    if (!value) {
        return undefined
    }

    try {
        const base = typeof window === 'undefined' ? PAYLOAD_CMS_ORIGIN : window.location.origin
        const url = new URL(value, base)
        const safeProtocol = ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)
            || value.startsWith('#')
        const retiredContentfulHost = url.hostname === 'contentful.com'
            || url.hostname.endsWith('.contentful.com')
            || url.hostname === 'ctfassets.net'
            || url.hostname.endsWith('.ctfassets.net')
        return !safeProtocol
            || retiredContentfulHost
            || url.hostname.includes('octana')
            ? undefined
            : value
    } catch (error) {
        return undefined
    }
}

/**
 * Resolves Contentful-style links in a Payload collection from its includes envelope.
 *
 * @param collection raw compatibility response containing primary and included records.
 * @returns a detached collection whose resolvable Entry and Asset links are embedded.
 * @throws Does not throw; missing or cyclic links remain in their retained link form.
 */
export function resolveCmsCollection<Fields extends Record<string, unknown>>(
    collection: CmsCollection<Fields>,
): CmsCollection<Fields> {
    const resources = [
        ...collection.items,
        ...(collection.includes?.Entry || []),
        ...(collection.includes?.Asset || []),
    ]
    const catalog = new Map<string, CmsResource>()
    resources.forEach(resource => {
        catalog.set(`${resource.sys.type}:${resource.sys.id}`, resource)
    })

    /**
     * Recursively embeds one value while retaining unresolved and cyclic links.
     *
     * @param value field value from the compatibility response.
     * @param ancestors relationship keys already visited on the current branch.
     * @returns a detached value containing every safely resolvable relationship.
     * @throws Does not throw.
     */
    const resolveValue = (value: unknown, ancestors: ReadonlySet<string>): unknown => {
        if (Array.isArray(value)) {
            return value.map(item => resolveValue(item, ancestors))
        }

        if (!value || typeof value !== 'object') {
            return value
        }

        const record = value as Record<string, unknown>
        const sys = record.sys as Record<string, unknown> | undefined
        if (sys?.type === 'Link' && typeof sys.id === 'string' && typeof sys.linkType === 'string') {
            const key = `${sys.linkType}:${sys.id}`
            const linked = catalog.get(key)
            if (!linked || ancestors.has(key)) {
                return value
            }

            const nextAncestors = new Set(ancestors)
            nextAncestors.add(key)
            return {
                ...linked,
                fields: resolveValue(linked.fields, nextAncestors),
            }
        }

        return Object.fromEntries(
            Object.entries(record)
                .map(([key, nested]) => [key, resolveValue(nested, ancestors)]),
        )
    }

    return {
        ...collection,
        items: collection.items.map(item => ({
            ...item,
            fields: resolveValue(
                item.fields,
                new Set([`${item.sys.type}:${item.sys.id}`]),
            ) as Fields,
        })),
    }
}

/**
 * Browser client for Payload's read-only Contentful compatibility facade.
 *
 * The client is used by Thrive and Blog pages. It never falls back to Contentful,
 * Octana, or community-app proxy endpoints.
 */
export class PayloadCmsClient {
    private readonly accessTokens: Record<CmsSpace, string>

    private readonly fetcher: typeof fetch

    private readonly origin: string

    /**
     * Creates a client with deployment tokens and the fixed approved CMS origin.
     *
     * @param options optional credential and fetch overrides used by tests.
     * @throws Does not throw.
     */
    constructor(options: PayloadCmsClientOptions = {}) {
        this.origin = PAYLOAD_CMS_ORIGIN
        this.fetcher = options.fetcher || fetch
        this.accessTokens = {
            ...CMS_ACCESS_TOKENS,
            ...options.accessTokens,
        }
    }

    /**
     * Queries published entries from one migrated Payload CMS space.
     *
     * @param space logical migrated space to read.
     * @param query Contentful-compatible filters and pagination values.
     * @param options optional AbortSignal for route changes and component cleanup.
     * @returns a resolved collection with linked entries/assets embedded from `includes`.
     * @throws CmsRequestError when credentials are absent, the network fails, or Payload rejects the request.
     */
    async queryEntries<Fields extends Record<string, unknown>>(
        space: CmsSpace,
        query: CmsQuery = {},
        options: CmsRequestOptions = {},
    ): Promise<CmsCollection<Fields>> {
        const token = this.accessTokens[space]
        if (!token) {
            throw new CmsRequestError(
                `Payload CMS access is not configured for the ${space} space.`,
                0,
            )
        }

        const queryString = serializeCmsQuery(query)
        const url = `${this.origin}/spaces/${CMS_SPACE_IDS[space]}/environments/${CMS_ENVIRONMENTS[space]}/entries${
            queryString ? `?${queryString}` : ''
        }`

        let response: Response
        try {
            response = await this.fetcher(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                signal: options.signal,
            })
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw error
            }

            throw new CmsRequestError('Payload CMS could not be reached.', 0)
        }

        if (!response.ok) {
            throw new CmsRequestError(
                response.status === 401
                    ? 'Payload CMS rejected the configured delivery credential.'
                    : `Payload CMS request failed with status ${response.status}.`,
                response.status,
            )
        }

        const collection = await response.json() as CmsCollection<Fields>
        return resolveCmsCollection(collection)
    }

    /**
     * Loads one published entry by its retained source identifier.
     *
     * @param space logical migrated space to read.
     * @param id retained source entry identifier.
     * @param options optional AbortSignal for route changes and component cleanup.
     * @returns the requested entry.
     * @throws CmsRequestError when the entry is unavailable or the response is malformed.
     */
    async getEntry<Fields extends Record<string, unknown>>(
        space: CmsSpace,
        id: string,
        options: CmsRequestOptions = {},
    ): Promise<CmsResource<Fields>> {
        const response = await this.queryEntries<Fields>(space, {
            include: 10,
            limit: 1,
            'sys.id': id,
        }, options)
        const entry = response.items[0]
        if (!entry) {
            throw new CmsRequestError(`Payload CMS entry ${id} was not found.`, 404)
        }

        return entry
    }
}

/** Shared client used by the public Thrive and Blog applications. */
export const payloadCmsClient = new PayloadCmsClient()

/**
 * Reads a Payload-hosted asset URL from an embedded CMS resource.
 *
 * @param resource embedded Asset resource returned by resolveCmsCollection.
 * @returns an approved absolute asset URL, or undefined when no migrated media is available.
 * @throws Does not throw.
 */
export function getCmsResourceAssetUrl(resource: unknown): string | undefined {
    const asset = resource as CmsResource<CmsAssetFields> | undefined
    return getPayloadAssetUrl(asset?.fields?.file?.url)
}
