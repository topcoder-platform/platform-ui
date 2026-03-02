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
        contentType?: {
            sys?: {
                id?: string
            }
        }
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
    tcHandle?: string
    avatar?: BackendContentfulLink
}

/**
 * Minimal Contentful category fields used by Thrive article sidebars.
 */
export interface BackendContentfulCategoryFields {
    name?: string
    trackParent?: string
}

/**
 * Minimal Contentful fields used by recommended Thrive article cards.
 */
export interface BackendContentfulRecommendedFields {
    contentUrl?: string
    externalArticle?: boolean
    featuredImage?: BackendContentfulLink
    slug?: string
    title?: string
}

/**
 * Unified includes entry fields used by article conversion helpers.
 */
export interface BackendContentfulIncludesEntryFields
    extends BackendContentfulAuthorFields,
        BackendContentfulCategoryFields,
        BackendContentfulRecommendedFields {
    [key: string]: unknown
}

/**
 * Includes container returned by Contentful collection queries.
 */
export interface BackendContentfulIncludes {
    Asset?: Array<BackendContentfulEntry<BackendContentfulAssetFields>>
    Entry?: Array<BackendContentfulEntry<BackendContentfulIncludesEntryFields>>
}

/**
 * Raw Contentful fields for a Thrive article entry.
 */
export interface BackendThriveArticleFields {
    bodyContent?: BackendContentfulLink
    content?: string
    contentCategory?: BackendContentfulLink[]
    contentAuthor?: BackendContentfulLink[]
    contentUrl?: string
    creationDate?: string
    externalArticle?: boolean
    featuredImage?: BackendContentfulLink
    leftSidebarContent?: BackendContentfulLink
    openExternalLinksInNewTab?: boolean
    readTime?: string
    recommended?: BackendContentfulLink[]
    slug?: string
    tags?: string[]
    title?: string
    trackCategory?: string
    type?: ThriveArticleType
    upvotes?: number
}

/**
 * Normalized Thrive author information.
 */
export interface AuthorInfo {
    avatarUrl: string
    id: string
    name: string
    tcHandle: string
}

/**
 * Normalized Thrive content category.
 */
export interface ContentCategory {
    id: string
    name: string
    trackParent: string
}

/**
 * Normalized recommended Thrive article.
 */
export interface RecommendedArticle {
    contentUrl: string
    externalArticle: boolean
    featuredImage: string
    id: string
    slug: string
    title: string
}

/**
 * Supported Contentful component types rendered inside Thrive articles.
 */
export type ThriveStructuredEntryType = 'banner' | 'contentBlock' | 'image' | 'viewport'

/**
 * Base shape for recursive structured content nodes.
 */
export interface ThriveStructuredEntryBase {
    id: string
    type: ThriveStructuredEntryType
}

/**
 * Normalized content block entry.
 */
export interface ThriveContentBlockStructuredEntry extends ThriveStructuredEntryBase {
    baseTheme: string
    imageUrl: string
    text: string
    type: 'contentBlock'
}

/**
 * Normalized banner entry.
 */
export interface ThriveBannerStructuredEntry extends ThriveStructuredEntryBase {
    backgroundImageUrl: string
    baseTheme: string
    text: string
    type: 'banner'
}

/**
 * Normalized image entry.
 */
export interface ThriveImageStructuredEntry extends ThriveStructuredEntryBase {
    alt: string
    sourceMobileUrl: string
    sourceUrl: string
    type: 'image'
}

/**
 * Normalized viewport entry for grouped child content.
 */
export interface ThriveViewportStructuredEntry extends ThriveStructuredEntryBase {
    items: Array<
        ThriveBannerStructuredEntry
        | ThriveContentBlockStructuredEntry
        | ThriveImageStructuredEntry
        | ThriveViewportStructuredEntry
    >
    theme: string
    type: 'viewport'
}

/**
 * Union for structured Contentful components rendered recursively on Thrive pages.
 */
export type ThriveStructuredEntry
    = ThriveBannerStructuredEntry
    | ThriveContentBlockStructuredEntry
    | ThriveImageStructuredEntry
    | ThriveViewportStructuredEntry

/**
 * Normalized Thrive article model used by the community app.
 */
export interface ThriveArticle {
    body: string
    bodyContent?: ThriveStructuredEntry
    contentAuthor: string
    contentAuthors: AuthorInfo[]
    contentCategory: ContentCategory[]
    contentUrl: string
    creationDate: string
    externalArticle: boolean
    featuredImage: string
    id: string
    leftSidebarContent?: ThriveStructuredEntry
    openExternalLinksInNewTab: boolean
    readTime: string
    recommended: RecommendedArticle[]
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

function isContentfulLink(value: unknown): value is BackendContentfulLink {
    return (
        typeof value === 'object'
        && value !== null
        && typeof (value as BackendContentfulLink).sys?.id === 'string'
    )
}

function asContentfulLink(value: unknown): BackendContentfulLink | undefined {
    return isContentfulLink(value) ? value : undefined
}

function asContentfulLinks(value: unknown): BackendContentfulLink[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value.filter(isContentfulLink)
}

function asString(value: unknown): string {
    return typeof value === 'string' ? value : ''
}

function resolveAssetUrl(
    assetLink: BackendContentfulLink | undefined,
    includes?: BackendContentfulIncludes,
): string {
    const assetId = assetLink?.sys?.id

    if (!assetId || !includes?.Asset?.length) {
        return ''
    }

    const asset = includes.Asset.find(entry => entry.sys.id === assetId)
    return normalizeImageUrl(asset?.fields?.file?.url)
}

function resolveAuthors(
    authorLinks: BackendContentfulLink[] | undefined,
    includes?: BackendContentfulIncludes,
): AuthorInfo[] {
    if (!authorLinks?.length || !includes?.Entry?.length) {
        return []
    }

    return authorLinks
        .map(link => {
            const authorId = link?.sys?.id ?? ''
            const author = includes.Entry?.find(entry => entry.sys.id === authorId)
            const avatarId = author?.fields?.avatar?.sys?.id
            const avatar = avatarId
                ? includes?.Asset?.find(asset => asset.sys.id === avatarId)
                : undefined

            return {
                avatarUrl: normalizeImageUrl(avatar?.fields?.file?.url),
                id: authorId,
                name: author?.fields?.name ?? '',
                tcHandle: author?.fields?.tcHandle ?? '',
            }
        })
        .filter(author => !!author.id)
}

function resolveCategories(
    categoryLinks: BackendContentfulLink[] | undefined,
    includes?: BackendContentfulIncludes,
): ContentCategory[] {
    if (!categoryLinks?.length || !includes?.Entry?.length) {
        return []
    }

    return categoryLinks
        .map(link => {
            const categoryId = link?.sys?.id ?? ''
            const category = includes.Entry?.find(entry => entry.sys.id === categoryId)

            return {
                id: categoryId,
                name: category?.fields?.name ?? '',
                trackParent: category?.fields?.trackParent ?? '',
            }
        })
        .filter(category => !!category.id)
}

function resolveRecommended(
    recommendedLinks: BackendContentfulLink[] | undefined,
    includes?: BackendContentfulIncludes,
): RecommendedArticle[] {
    if (!recommendedLinks?.length || !includes?.Entry?.length) {
        return []
    }

    return recommendedLinks
        .map(link => {
            const recommendedId = link?.sys?.id ?? ''
            const recommendedEntry
                = includes.Entry?.find(entry => entry.sys.id === recommendedId)
            return {
                contentUrl: recommendedEntry?.fields?.contentUrl ?? '',
                externalArticle: recommendedEntry?.fields?.externalArticle ?? false,
                featuredImage: resolveAssetUrl(
                    recommendedEntry?.fields?.featuredImage,
                    includes,
                ),
                id: recommendedId,
                slug: recommendedEntry?.fields?.slug ?? '',
                title: recommendedEntry?.fields?.title ?? '',
            }
        })
        .filter(recommended => !!recommended.id)
}

function resolveFeaturedImage(
    featuredImage: BackendContentfulLink | undefined,
    includes?: BackendContentfulIncludes,
): string {
    return resolveAssetUrl(featuredImage, includes)
}

function resolveType(value: string | undefined): ThriveArticleType {
    if (value === 'Forum post' || value === 'Video') {
        return value
    }

    return 'Article'
}

const SUPPORTED_STRUCTURED_ENTRY_TYPES: ReadonlySet<ThriveStructuredEntryType> = new Set<ThriveStructuredEntryType>([
    'banner',
    'contentBlock',
    'image',
    'viewport',
])

function resolveStructuredEntry(
    entryLink: BackendContentfulLink | undefined,
    includes?: BackendContentfulIncludes,
    visitedEntryIds: Set<string> = new Set(),
): ThriveStructuredEntry | undefined {
    const entryId = entryLink?.sys?.id
    if (!entryId || !includes?.Entry?.length || visitedEntryIds.has(entryId)) {
        return undefined
    }

    const entry = includes.Entry.find(includeEntry => includeEntry.sys.id === entryId)
    const entryType = entry?.sys?.contentType?.sys?.id
    if (!entry || !entryType || !SUPPORTED_STRUCTURED_ENTRY_TYPES.has(entryType as ThriveStructuredEntryType)) {
        return undefined
    }

    visitedEntryIds.add(entryId)
    const fields = entry.fields

    switch (entryType) {
        case 'viewport': {

            const items = asContentfulLinks(fields.content)
                .map(childEntry => resolveStructuredEntry(childEntry, includes, visitedEntryIds))
                .filter(
                    (childEntry): childEntry is ThriveStructuredEntry => childEntry !== undefined,
                )

            visitedEntryIds.delete(entryId)

            return {
                id: entryId,
                items,
                theme: asString(fields.theme),
                type: 'viewport',
            }
        }

        case 'contentBlock': {

            const resolvedEntry: ThriveContentBlockStructuredEntry = {
                baseTheme: asString(fields.baseTheme),
                id: entryId,
                imageUrl: resolveAssetUrl(asContentfulLink(fields.image), includes),
                text: asString(fields.text),
                type: 'contentBlock',
            }

            visitedEntryIds.delete(entryId)

            return resolvedEntry
        }

        case 'banner': {

            const resolvedEntry: ThriveBannerStructuredEntry = {
                backgroundImageUrl: resolveAssetUrl(
                    asContentfulLink(fields.backgroundImage),
                    includes,
                ),
                baseTheme: asString(fields.baseTheme),
                id: entryId,
                text: asString(fields.text),
                type: 'banner',
            }

            visitedEntryIds.delete(entryId)

            return resolvedEntry
        }

        case 'image': {

            const resolvedEntry: ThriveImageStructuredEntry = {
                alt: asString(fields.alt) || asString(fields.name),
                id: entryId,
                sourceMobileUrl: resolveAssetUrl(
                    asContentfulLink(fields.sourceMobile),
                    includes,
                ),
                sourceUrl: resolveAssetUrl(asContentfulLink(fields.source), includes),
                type: 'image',
            }

            visitedEntryIds.delete(entryId)

            return resolvedEntry
        }

        default:

            visitedEntryIds.delete(entryId)
            return undefined
    }
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
    const contentAuthors = resolveAuthors(fields.contentAuthor, includes)

    return {
        body: fields.content ?? '',
        bodyContent: resolveStructuredEntry(fields.bodyContent, includes),
        contentAuthor: contentAuthors[0]?.name ?? '',
        contentAuthors,
        contentCategory: resolveCategories(fields.contentCategory, includes),
        contentUrl: fields.contentUrl ?? '',
        creationDate: fields.creationDate ?? '',
        externalArticle: fields.externalArticle ?? false,
        featuredImage: resolveFeaturedImage(fields.featuredImage, includes),
        id: entry.sys.id,
        leftSidebarContent: resolveStructuredEntry(fields.leftSidebarContent, includes),
        openExternalLinksInNewTab: fields.openExternalLinksInNewTab !== false,
        readTime: fields.readTime ?? '',
        recommended: resolveRecommended(fields.recommended, includes),
        slug: fields.slug ?? '',
        tags: fields.tags ?? [],
        title: fields.title ?? '',
        trackCategory: fields.trackCategory ?? '',
        type: resolveType(fields.type),
        upvotes: fields.upvotes ?? 0,
    }
}
