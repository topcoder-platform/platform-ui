/**
 * Supported Thrive article content types.
 */
export type ThriveArticleType = 'Article' | 'Video' | 'Forum post'

/**
 * Generic Contentful entry shape.
 */
export interface BackendContentfulEntry<T> {
    fields: T
    sys: {
        id: string
    }
}

/**
 * Contentful link object.
 */
export interface BackendContentfulLink {
    sys: {
        id: string
    }
}

/**
 * Includes container returned by Contentful collection queries.
 */
export interface BackendContentfulAssetFields {
    file?: {
        url?: string
    }
}

/**
 * Minimal Contentful author fields used by Thrive cards.
 */
export interface BackendContentfulAuthorFields {
    name?: string
}

/**
 * Includes container returned by Contentful collection queries.
 */
export interface BackendContentfulIncludes {
    Asset?: Array<BackendContentfulEntry<BackendContentfulAssetFields>>
    Entry?: Array<BackendContentfulEntry<BackendContentfulAuthorFields>>
}

/**
 * Raw Contentful fields for a Thrive article entry.
 */
export interface BackendThriveArticleFields {
    body?: string
    contentAuthor?: BackendContentfulLink[]
    creationDate?: string
    featuredImage?: BackendContentfulLink
    slug?: string
    tags?: string[]
    title?: string
    trackCategory?: string
    type?: ThriveArticleType
    upvotes?: number
}

/**
 * Normalized Thrive article model used by the community app.
 */
export interface ThriveArticle {
    body: string
    contentAuthor: string
    creationDate: string
    featuredImage: string
    id: string
    slug: string
    tags: string[]
    title: string
    trackCategory: string
    type: ThriveArticleType
    upvotes: number
}

function normalizeImageUrl(url?: string): string {
    if (!url) {
        return ''
    }

    return url.startsWith('//') ? `https:${url}` : url
}

function resolveAuthorName(
    authorLinks: BackendContentfulLink[] | undefined,
    includes?: BackendContentfulIncludes,
): string {
    const authorId = authorLinks?.[0]?.sys?.id

    if (!authorId || !includes?.Entry) {
        return ''
    }

    const author = includes.Entry.find(entry => entry.sys.id === authorId)
    return author?.fields?.name ?? ''
}

function resolveFeaturedImage(
    featuredImage: BackendContentfulLink | undefined,
    includes?: BackendContentfulIncludes,
): string {
    const imageId = featuredImage?.sys?.id

    if (!imageId || !includes?.Asset) {
        return ''
    }

    const image = includes.Asset.find(asset => asset.sys.id === imageId)
    return normalizeImageUrl(image?.fields?.file?.url)
}

function resolveType(value: string | undefined): ThriveArticleType {
    if (value === 'Forum post' || value === 'Video') {
        return value
    }

    return 'Article'
}

/**
 * Converts a Contentful article entry into the normalized Thrive article model.
 *
 * @param entry Raw Contentful article entry.
 * @param includes Optional includes map for linked assets and authors.
 * @returns Converted Thrive article.
 */
export function convertContentfulArticle(
    entry: BackendContentfulEntry<BackendThriveArticleFields>,
    includes?: BackendContentfulIncludes,
): ThriveArticle {
    const fields = entry.fields ?? {}

    return {
        body: fields.body ?? '',
        contentAuthor: resolveAuthorName(fields.contentAuthor, includes),
        creationDate: fields.creationDate ?? '',
        featuredImage: resolveFeaturedImage(fields.featuredImage, includes),
        id: entry.sys.id,
        slug: fields.slug ?? '',
        tags: fields.tags ?? [],
        title: fields.title ?? '',
        trackCategory: fields.trackCategory ?? '',
        type: resolveType(fields.type),
        upvotes: fields.upvotes ?? 0,
    }
}
