import {
    CmsQuery,
    CmsResource,
    getCmsResourceAssetUrl,
} from '~/libs/cms'

import {
    ThriveArticleFields,
    ThriveCategoryFields,
    ThriveContentType,
    ThriveFilters,
    ThrivePersonFields,
    ThriveReference,
} from '../models'

/**
 * Identifies an embedded CMS resource after compatibility-link resolution.
 *
 * @param value retained link or resolved resource.
 * @returns true when fields are available on the embedded record.
 * @throws Does not throw.
 */
export function isResolvedCmsResource<Fields extends Record<string, unknown>>(
    value: ThriveReference<Fields> | undefined,
): value is CmsResource<Fields> {
    return Boolean(value && 'fields' in value)
}

/**
 * Returns an article's approved Payload-hosted featured image URL.
 *
 * @param article Thrive article entry or fields.
 * @returns an assets.topcoder-dev.com URL, or undefined when no migrated image exists.
 * @throws Does not throw.
 */
export function getThriveImageUrl(
    article: CmsResource<ThriveArticleFields> | ThriveArticleFields,
): string | undefined {
    const fields: ThriveArticleFields = 'fields' in article && 'sys' in article
        ? (article as CmsResource<ThriveArticleFields>).fields
        : article as ThriveArticleFields
    return getCmsResourceAssetUrl(fields.featuredImage)
}

/**
 * Returns resolved authors attached to one Thrive record.
 *
 * @param article Thrive content fields.
 * @returns embedded author resources in source order.
 * @throws Does not throw.
 */
export function getThriveAuthors(article: ThriveArticleFields): Array<CmsResource<ThrivePersonFields>> {
    return (article.contentAuthor || [])
        .filter(isResolvedCmsResource<ThrivePersonFields>)
}

/**
 * Returns resolved taxonomy categories attached to one Thrive record.
 *
 * @param article Thrive content fields.
 * @returns embedded taxonomy resources in source order.
 * @throws Does not throw.
 */
export function getThriveCategories(
    article: ThriveArticleFields,
): Array<CmsResource<ThriveCategoryFields>> {
    return (article.contentCategory || [])
        .filter(isResolvedCmsResource<ThriveCategoryFields>)
}

/**
 * Builds the canonical internal or external destination for a Thrive record.
 *
 * @param article Thrive content fields.
 * @returns external content URL when configured, otherwise the local article route.
 * @throws URIError when an article title cannot be encoded for its legacy slug fallback.
 */
export function getThriveArticleUrl(article: ThriveArticleFields): string {
    if (article.externalArticle && article.contentUrl) {
        return article.contentUrl
    }

    return `/thrive/articles/${encodeURIComponent(article.slug || article.title)}`
}

/**
 * Removes markdown and HTML syntax for compact article-card previews.
 *
 * @param markdown CMS-authored article content.
 * @param maximumLength maximum returned character count before an ellipsis.
 * @returns whitespace-normalized preview text.
 * @throws Does not throw.
 */
export function getMarkdownPreview(markdown: string, maximumLength: number = 150): string {
    const text = String(markdown || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[`#>*_~|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    return text.length > maximumLength ? `${text.slice(0, maximumLength)
        .trim()}…` : text
}

/**
 * Formats a retained CMS publication date in the legacy Thrive display format.
 *
 * @param value ISO date from the article fields or system metadata.
 * @returns localized month, day, and year, or an empty string for an invalid date.
 * @throws Does not throw.
 */
export function formatThriveDate(value: string | undefined): string {
    const date = new Date(value || '')
    return Number.isNaN(date.getTime())
        ? ''
        : new Intl.DateTimeFormat('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
            .format(date)
}

/**
 * Converts URL search parameters into normalized Thrive filters.
 *
 * @param search current location search string.
 * @returns normalized track, taxonomy, author, date, tag, and phrase filters.
 * @throws Does not throw for repeated or malformed values.
 */
export function parseThriveFilters(search: string): ThriveFilters {
    const query = new URLSearchParams(search)
    /**
     * Reads comma-separated and repeated values for one route parameter.
     *
     * @param name route query key.
     * @returns trimmed, non-empty values in URL order.
     * @throws Does not throw.
     */
    const values = (name: string): string[] => query.getAll(name)
        .flatMap(value => value.split(','))
        .map(value => value.trim())
        .filter(Boolean)
    const sortBy = query.get('sortBy') === 'Likes' ? 'Likes' : 'Content Publish Date'
    return {
        author: query.get('author') || undefined,
        endDate: query.get('endDate') || undefined,
        phrase: (query.get('phrase') || undefined)?.slice(0, 115),
        sortBy,
        startDate: query.get('startDate') || undefined,
        tags: [...values('tags'), ...values('tags[]')],
        tax: values('tax'),
        title: (query.get('title') || undefined)?.slice(0, 115),
        track: query.get('track') || undefined,
    }
}

/**
 * Builds one Payload CMS query for a Thrive content type and active filters.
 *
 * @param type Article, Video, or Forum post tab.
 * @param filters route-driven filters selected by the visitor.
 * @param categories resolved taxonomy used to translate category names to retained IDs.
 * @param authorId resolved author identifier, or the no-match sentinel.
 * @param limit page size requested from Payload.
 * @param skip number of matching records already rendered.
 * @returns compatibility query accepted by cms.topcoder-dev.com.
 * @throws Does not throw.
 */
export function buildThriveContentQuery(
    type: ThriveContentType,
    filters: ThriveFilters,
    categories: Array<CmsResource<ThriveCategoryFields>>,
    authorId?: string,
    limit: number = 5,
    skip: number = 0,
): CmsQuery {
    const categoryIds = categories
        .filter(category => !filters.track || category.fields.trackParent === filters.track)
        .filter(category => !filters.tax?.length || filters.tax.includes(category.fields.name))
        .map(category => category.sys.id)
    return {
        content_type: 'article',
        'fields.contentAuthor.sys.id': authorId,
        'fields.contentCategory.sys.id[in]': filters.tax?.length
            ? categoryIds.join(',') || 'NO_SUCH_ID'
            : undefined,
        'fields.creationDate[gte]': filters.startDate,
        'fields.creationDate[lte]': filters.endDate,
        'fields.tags[all]': filters.tags.length ? filters.tags.join(',') : undefined,
        'fields.title[match]': filters.title,
        'fields.trackCategory': filters.track,
        'fields.type': type,
        include: 3,
        limit,
        order: filters.sortBy === 'Likes'
            ? '-fields.upvotes,-fields.creationDate'
            : '-fields.creationDate',
        query: filters.phrase,
        skip,
    }
}

/**
 * Groups resolved Thrive taxonomy records by their parent track.
 *
 * @param categories Payload-hosted content-category records.
 * @returns alphabetized categories keyed by track name.
 * @throws Does not throw.
 */
export function groupThriveCategories(
    categories: Array<CmsResource<ThriveCategoryFields>>,
): Record<string, Array<CmsResource<ThriveCategoryFields>>> {
    return categories.reduce<Record<string, Array<CmsResource<ThriveCategoryFields>>>>((groups, category) => {
        const track = category.fields.trackParent
        groups[track] = [...(groups[track] || []), category]
            .sort((first, second) => first.fields.name.localeCompare(second.fields.name))
        return groups
    }, {})
}

/**
 * Finds resolved Thrive articles nested inside a Payload-backed editable viewport.
 *
 * @param value resolved CMS viewport, relationship, collection, or field value.
 * @returns unique embedded article records in authored traversal order.
 * @throws Does not throw for malformed or cyclic CMS values.
 */
export function collectThriveArticles(value: unknown): Array<CmsResource<ThriveArticleFields>> {
    const articles = new Map<string, CmsResource<ThriveArticleFields>>()
    const visited = new WeakSet<object>()

    /**
     * Traverses one viewport branch while protecting against malformed cyclic objects.
     *
     * @param nested current relationship or field value.
     * @returns nothing after matching articles and children are inspected.
     * @throws Does not throw.
     */
    const visit = (nested: unknown): void => {
        if (!nested || typeof nested !== 'object' || visited.has(nested)) {
            return
        }

        visited.add(nested)
        if (Array.isArray(nested)) {
            nested.forEach(visit)
            return
        }

        const record = nested as Record<string, unknown>
        const fields = record.fields as Record<string, unknown> | undefined
        const sys = record.sys as Record<string, unknown> | undefined
        if (
            sys?.type === 'Entry'
            && typeof sys.id === 'string'
            && typeof fields?.content === 'string'
            && typeof fields.title === 'string'
            && ['Article', 'Forum post', 'Video'].includes(String(fields.type))
        ) {
            articles.set(sys.id, nested as CmsResource<ThriveArticleFields>)
        }

        Object.values(record)
            .forEach(visit)
    }

    visit(value)
    return Array.from(articles.values())
}
