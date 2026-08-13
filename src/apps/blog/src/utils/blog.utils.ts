import type {
    CmsCollection,
    CmsQuery,
    CmsResource,
} from '~/libs/cms'
import { getCmsResourceAssetUrl } from '~/libs/cms'

import type {
    BlogArticleFields,
    BlogArticleFilters,
    BlogAuthorFields,
    BlogCardsPerRow,
    BlogComponentImageFields,
    BlogListItem,
    BlogPageFields,
    BlogReference,
    BlogRichTextNode,
    BlogTaxonomyFields,
} from '../models'

/** Retained website Page that hosts the migrated Blog cards. */
export const BLOG_ROOT_PAGE_ID = 'iz7zIybJoja037o8NM676'

/** Retained page-cards entry used by the migrated Blog root. */
export const BLOG_PAGE_CARDS_ID = 'xGSJ2gbb4NTY7wQUoZgdf'

/** Content type containing the article records referenced by Blog Pages. */
export const BLOG_ARTICLE_CONTENT_TYPE = 'pageContentArticle'

/** Number of articles rendered on each Blog list page. */
export const BLOG_PAGE_SIZE = 12

/** Responsive card counts retained from the migrated Blog page-cards configuration. */
export const BLOG_CARD_COLUMNS: Readonly<BlogCardsPerRow> = Object.freeze({ md: 3, xs: 1 })

const BLOG_ARTICLE_SELECT = [
    'sys',
    'fields.name',
    'fields.title',
    'fields.cardImage',
    'fields.snippet',
    'fields.publishedDate',
    'fields.category',
    'fields.topics',
    'fields.authors',
].join(',')

/**
 * Identifies a linked Blog value that Payload's compatibility response resolved.
 *
 * @param value retained link or resolved record.
 * @returns true when the value embeds fields and resource metadata.
 * @throws Does not throw.
 */
export function isResolvedBlogResource<Fields extends Record<string, unknown>>(
    value: BlogReference<Fields> | undefined,
): value is CmsResource<Fields> {
    return Boolean(value && 'fields' in value && 'sys' in value)
}

/**
 * Builds the exact paginated `pageContentArticle` query used by the Blog list.
 *
 * @param page one-based Blog list page.
 * @param filters optional relationship IDs supplied by the page-cards configuration.
 * @returns a Contentful-compatible Payload query with ordering, projection, and filters.
 * @throws Does not throw.
 */
export function buildBlogArticleQuery(page: number, filters: BlogArticleFilters = {}): CmsQuery {
    const pageSize = getBlogPageSize(filters)
    const effectivePage = filters.limit ? 1 : Math.max(1, page)
    return {
        content_type: BLOG_ARTICLE_CONTENT_TYPE,
        'fields.authors.sys.id[in]': filters.authorIds?.length ? filters.authorIds.join(',') : undefined,
        'fields.category.sys.id[in]': filters.categoryIds?.length ? filters.categoryIds.join(',') : undefined,
        'fields.topics.sys.id[in]': filters.topicIds?.length ? filters.topicIds.join(',') : undefined,
        include: 5,
        limit: pageSize,
        order: '-fields.publishedDate',
        select: BLOG_ARTICLE_SELECT,
        skip: (effectivePage - 1) * pageSize,
        'sys.id[in]': filters.articleIds?.length ? filters.articleIds.join(',') : undefined,
    }
}

/**
 * Resolves the Page Cards page size while retaining the Blog migration default.
 *
 * @param filters authored Page Cards controls.
 * @returns a positive request page size, using limit as the size for an unpaginated list.
 * @throws Does not throw for malformed numbers.
 */
export function getBlogPageSize(filters: BlogArticleFilters): number {
    return filters.limit || filters.pageSize || BLOG_PAGE_SIZE
}

/**
 * Merges authored responsive column counts over the Blog card defaults.
 *
 * @param filters authored Page Cards controls.
 * @returns safe one-to-six column counts for the xs, sm, md, and lg breakpoints.
 * @throws Does not throw for malformed breakpoint values.
 */
export function getBlogCardsPerRow(filters: BlogArticleFilters): BlogCardsPerRow {
    const authored = filters.cardsPerRow || {}
    return {
        ...(authored.lg ? { lg: authored.lg } : {}),
        md: authored.md || BLOG_CARD_COLUMNS.md,
        ...(authored.sm ? { sm: authored.sm } : {}),
        xs: authored.xs || BLOG_CARD_COLUMNS.xs,
    }
}

/**
 * Applies the optional authored total limit to Payload's matching record count.
 *
 * @param total total matching articles reported by Payload CMS.
 * @param filters authored Page Cards controls.
 * @returns the total available to this Blog list after its optional limit.
 * @throws Does not throw.
 */
export function getBlogLimitedTotal(total: number, filters: BlogArticleFilters): number {
    return filters.limit ? Math.min(total, filters.limit) : total
}

/**
 * Builds the batched Page lookup that supplies routes for one article page.
 *
 * @param articleIds retained IDs from the current ordered article collection.
 * @returns a Page query whose content-link filter contains the supplied IDs.
 * @throws Does not throw.
 */
export function buildBlogPageLookupQuery(articleIds: ReadonlyArray<string>): CmsQuery {
    return {
        content_type: 'page',
        'fields.content.sys.id[in]': articleIds.join(','),
        include: 0,
        select: 'sys,fields.url,fields.content',
    }
}

/**
 * Builds the Page query used to resolve one Blog route and its fully included article.
 *
 * @param slug decoded final route segment.
 * @returns a two-path Page lookup that prefers the `/blog` route during selection.
 * @throws Does not throw.
 */
export function buildBlogDetailQuery(slug: string): CmsQuery {
    const normalizedSlug = slug.replace(/^\/+|\/+$/g, '')
    return {
        content_type: 'page',
        'fields.url[in]': `/blog/${normalizedSlug},/${normalizedSlug}`,
        include: 10,
        limit: 2,
    }
}

/**
 * Joins ordered articles to their routed Pages without changing list order or metadata.
 *
 * @param articles paginated article response returned by Payload CMS.
 * @param pages Page records whose content links reference the articles.
 * @returns the original pagination values with same-order article and Page URL pairs.
 * @throws Does not throw; articles without a Page remain present with no URL.
 */
export function joinBlogArticlesToPages(
    articles: CmsCollection<BlogArticleFields>,
    pages: ReadonlyArray<CmsResource<BlogPageFields>>,
): Omit<CmsCollection<BlogArticleFields>, 'items'> & { items: BlogListItem[] } {
    const pageUrls = new Map<string, string>()
    pages.forEach(page => {
        const contentId = page.fields.content?.sys.id
        if (contentId && page.fields.url && !pageUrls.has(contentId)) {
            pageUrls.set(contentId, page.fields.url)
        }
    })

    return {
        ...articles,
        items: articles.items.map(article => ({
            article,
            pageUrl: pageUrls.get(article.sys.id),
        })),
    }
}

/**
 * Selects the preferred routed Page and verifies its content is a resolved Blog article.
 *
 * @param pages candidate Page records from the two-path detail query.
 * @param slug decoded final route segment.
 * @returns the resolved `pageContentArticle` and its Page URL, or undefined for invalid content.
 * @throws Does not throw.
 */
export function selectBlogArticlePage(
    pages: ReadonlyArray<CmsResource<BlogPageFields>>,
    slug: string,
): BlogListItem | undefined {
    const normalizedSlug = slug.replace(/^\/+|\/+$/g, '')
    const preferredUrls = [`/blog/${normalizedSlug}`, `/${normalizedSlug}`]
    const orderedPages = [...pages].sort((left, right) => (
        preferredUrls.indexOf(left.fields.url || '') - preferredUrls.indexOf(right.fields.url || '')
    ))
    const page = orderedPages.find(candidate => {
        const content = candidate.fields.content
        return preferredUrls.includes(candidate.fields.url || '')
            && isResolvedBlogResource(content)
            && content.sys.contentType?.sys.id === BLOG_ARTICLE_CONTENT_TYPE
    })
    const article = page?.fields.content

    return page && isResolvedBlogResource(article)
        ? { article, pageUrl: page.fields.url }
        : undefined
}

/**
 * Converts a migrated Page URL to a route owned by the platform-ui Blog sub-application.
 *
 * @param pageUrl Page URL joined from Payload CMS.
 * @returns a canonical `/blog/:slug` path, or undefined for missing/unsafe paths.
 * @throws Does not throw.
 */
export function getBlogPostHref(pageUrl: string | undefined): string | undefined {
    if (!pageUrl || !pageUrl.startsWith('/') || pageUrl.startsWith('//')) {
        return undefined
    }

    const cleanPath = pageUrl.split(/[?#]/u)[0].replace(/\/+$/u, '')
    if (!cleanPath || cleanPath === '/blog') {
        return undefined
    }

    return cleanPath.startsWith('/blog/')
        ? cleanPath
        : `/blog/${cleanPath.replace(/^\/+/, '')}`
}

/**
 * Returns an approved card-image URL for a Blog list article.
 *
 * @param article Blog fields or full CMS record.
 * @returns an assets.topcoder-dev.com URL, or undefined when no safe image exists.
 * @throws Does not throw.
 */
export function getBlogCardImageUrl(
    article: BlogArticleFields | CmsResource<BlogArticleFields>,
): string | undefined {
    const fields: BlogArticleFields = 'fields' in article && 'sys' in article
        ? (article as CmsResource<BlogArticleFields>).fields
        : article as BlogArticleFields
    return getCmsResourceAssetUrl(fields.cardImage)
}

/**
 * Returns an approved hero-image URL from an article's `componentImage` relationship.
 *
 * @param article Blog fields or full CMS record.
 * @returns an assets.topcoder-dev.com URL, or undefined when the component or Asset is unresolved.
 * @throws Does not throw.
 */
export function getBlogHeroUrl(
    article: BlogArticleFields | CmsResource<BlogArticleFields>,
): string | undefined {
    const fields: BlogArticleFields = 'fields' in article && 'sys' in article
        ? (article as CmsResource<BlogArticleFields>).fields
        : article as BlogArticleFields
    const heroMedia = fields.heroMedia as BlogReference<BlogComponentImageFields> | undefined
    return isResolvedBlogResource(heroMedia)
        ? getCmsResourceAssetUrl(heroMedia.fields.image)
        : undefined
}

/**
 * Reads author names from resolved `authors` relationships.
 *
 * @param authors resolved or retained author relationships.
 * @returns ordered `authorName` values, excluding unresolved and malformed authors.
 * @throws Does not throw.
 */
export function getBlogAuthors(
    authors: ReadonlyArray<BlogReference<BlogAuthorFields>> | undefined,
): Array<CmsResource<BlogAuthorFields>> {
    return (authors || []).filter(isResolvedBlogResource<BlogAuthorFields>)
}

/**
 * Reads taxonomy entries from resolved Blog category or topic relationships.
 *
 * @param values resolved or retained taxonomy relationships.
 * @returns ordered records with a non-empty title.
 * @throws Does not throw.
 */
export function getBlogTaxonomies(
    values: ReadonlyArray<BlogReference<BlogTaxonomyFields>> | undefined,
): Array<CmsResource<BlogTaxonomyFields>> {
    return (values || [])
        .filter(isResolvedBlogResource<BlogTaxonomyFields>)
        .filter(value => Boolean(value.fields.title))
}

/**
 * Formats a Blog publication date using the legacy weekday/month presentation.
 *
 * @param value retained CMS publication timestamp.
 * @returns a localized date or an empty string for invalid input.
 * @throws Does not throw.
 */
export function formatBlogDate(value: string | undefined): string {
    const date = new Date(value || '')
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: 'long',
        weekday: 'long',
        year: 'numeric',
    })
        .format(date)
}

/**
 * Normalizes a requested Blog page to the available one-based range.
 *
 * @param requested numeric route segment.
 * @param total total number of matching Blog articles.
 * @param pageSize records rendered per page.
 * @returns a safe one-based page number.
 * @throws Does not throw.
 */
export function normalizeBlogPage(
    requested: string | undefined,
    total: number = 0,
    pageSize: number = BLOG_PAGE_SIZE,
): number {
    const parsed = Number(requested)
    const maximum = Math.max(1, Math.ceil(total / pageSize))
    return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : 1
}

/**
 * Extracts plain text from a Rich Text AST for metadata and accessible fallbacks.
 *
 * @param value possible Rich Text root or child node.
 * @returns concatenated text-node content with normalized whitespace.
 * @throws Does not throw for malformed values.
 */
export function getBlogRichTextPlainText(value: unknown): string {
    if (!value || typeof value !== 'object') {
        return ''
    }

    const node = value as BlogRichTextNode
    const ownText = node.nodeType === 'text' && typeof node.value === 'string' ? node.value : ''
    const childText = Array.isArray(node.content)
        ? node.content.map(getBlogRichTextPlainText)
            .join(' ')
        : ''
    return `${ownText} ${childText}`.replace(/\s+/gu, ' ')
        .trim()
}

/**
 * Finds optional author, category, and topic relationship filters in the configured Page Cards entry.
 *
 * @param rootPage resolved Blog root Page containing the Page Cards relationship tree.
 * @returns deduplicated relationship IDs, or an empty object when configuration is unavailable.
 * @throws Does not throw for malformed or partially resolved Page configuration.
 */
export function getBlogPageCardFilters(rootPage: CmsResource | undefined): BlogArticleFilters {
    const visited = new Set<unknown>()

    /**
     * Searches resolved Page fields for the retained Page Cards entry.
     *
     * @param value current relationship-tree value.
     * @returns the Page Cards resource, or undefined when it is absent.
     * @throws Does not throw for cyclic values.
     */
    const findPageCards = (value: unknown): CmsResource | undefined => {
        if (!value || typeof value !== 'object' || visited.has(value)) {
            return undefined
        }

        visited.add(value)
        if (!Array.isArray(value)) {
            const resource = value as Partial<CmsResource>
            if (resource.sys?.id === BLOG_PAGE_CARDS_ID && resource.fields) {
                return resource as CmsResource
            }
        }

        const nestedValues = Array.isArray(value)
            ? value
            : Object.values(value as Record<string, unknown>)
        return nestedValues.map(findPageCards)
            .find(Boolean)
    }

    const cardFields = findPageCards(rootPage)?.fields
    if (!cardFields) {
        return {}
    }

    /**
     * Reads retained relationship IDs from singular or plural Page Cards fields.
     *
     * @param value field containing links or resolved entries.
     * @returns unique relationship IDs in authored order.
     * @throws Does not throw.
     */
    const readIds = (value: unknown): string[] => {
        const values = Array.isArray(value) ? value : value ? [value] : []
        return Array.from(new Set(values
            .map(item => (item as { sys?: { id?: unknown } })?.sys?.id)
            .filter((id): id is string => typeof id === 'string' && Boolean(id))))
    }

    /**
     * Reads explicit article IDs, accepting either article entries or Page entries that wrap them.
     *
     * @param value authored `articles` relationships from Page Cards.
     * @returns unique `pageContentArticle` relationship IDs in authored order.
     * @throws Does not throw for retained links or partially resolved Pages.
     */
    const readArticleIds = (value: unknown): string[] => {
        const values = Array.isArray(value) ? value : value ? [value] : []
        const ids = values.map(item => {
            const resource = item as Partial<CmsResource<Record<string, unknown>>>
            const content = resource.fields?.content as { sys?: { id?: unknown } } | undefined
            return typeof content?.sys?.id === 'string' ? content.sys.id : resource.sys?.id
        })
        return Array.from(new Set(ids.filter((id): id is string => typeof id === 'string' && Boolean(id))))
    }

    /**
     * Reads a positive integer Page Cards value.
     *
     * @param value authored numeric field.
     * @param maximum optional inclusive upper bound.
     * @returns a normalized integer, or undefined for invalid input.
     * @throws Does not throw.
     */
    const readPositiveInteger = (value: unknown, maximum?: number): number | undefined => {
        const parsed = Number(value)
        return Number.isInteger(parsed) && parsed > 0 && (!maximum || parsed <= maximum)
            ? parsed
            : undefined
    }

    /**
     * Reads responsive card columns from the Page Cards object.
     *
     * @param value possible `{ xs, sm, md, lg }` configuration object.
     * @returns safe authored breakpoint values, or undefined when none are valid.
     * @throws Does not throw.
     */
    const readCardsPerRow = (value: unknown): BlogCardsPerRow | undefined => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return undefined
        }

        const source = value as Record<string, unknown>
        const lg = readPositiveInteger(source.lg, 6)
        const md = readPositiveInteger(source.md, 6)
        const sm = readPositiveInteger(source.sm, 6)
        const xs = readPositiveInteger(source.xs ?? source._, 6)
        const columns: BlogCardsPerRow = {
            ...(lg ? { lg } : {}),
            ...(md ? { md } : {}),
            ...(sm ? { sm } : {}),
            ...(xs ? { xs } : {}),
        }
        return Object.values(columns)
            .some(Boolean) ? columns : undefined
    }

    const nestedFilters = cardFields.filters && typeof cardFields.filters === 'object'
        ? cardFields.filters as Record<string, unknown>
        : {}

    return {
        articleIds: readArticleIds(cardFields.articles || nestedFilters.articles),
        authorIds: readIds(cardFields.authors || cardFields.author || nestedFilters.authors || nestedFilters.author),
        cardsPerRow: readCardsPerRow(cardFields.cardsPerRow),
        categoryIds: readIds(
            cardFields.categories || cardFields.category || nestedFilters.categories || nestedFilters.category,
        ),
        hideSnippet: typeof cardFields.hideSnippet === 'boolean' ? cardFields.hideSnippet : undefined,
        limit: readPositiveInteger(cardFields.limit),
        pageSize: readPositiveInteger(cardFields.pageSize),
        topicIds: readIds(cardFields.topics || cardFields.topic || nestedFilters.topics || nestedFilters.topic),
    }
}
