import type { CmsAssetFields, CmsLink, CmsResource } from '~/libs/cms'

/** Linked Blog value after Payload compatibility relationship resolution. */
export type BlogReference<Fields extends Record<string, unknown>> = CmsLink | CmsResource<Fields>

/** One mark applied to a text node in a Payload-hosted Rich Text document. */
export interface BlogRichTextMark {
    type: string
}

/** A node in the Contentful-compatible Rich Text JSON AST returned by Payload CMS. */
export interface BlogRichTextNode {
    content?: BlogRichTextNode[]
    data?: Record<string, unknown>
    marks?: BlogRichTextMark[]
    nodeType: string
    value?: string
}

/** Root document stored in Blog article body and snippet fields. */
export interface BlogRichTextDocument extends BlogRichTextNode {
    content: BlogRichTextNode[]
    nodeType: 'document'
}

/** Fields stored for a Blog author record. */
export interface BlogAuthorFields extends Record<string, unknown> {
    authorName: string
    slug?: string
}

/** Fields stored for a Blog category or topic record. */
export interface BlogTaxonomyFields extends Record<string, unknown> {
    slug?: string
    title: string
}

/** Fields stored by the `componentImage` relationship used as article hero media. */
export interface BlogComponentImageFields extends Record<string, unknown> {
    image?: BlogReference<CmsAssetFields>
}

/** Fields stored for a public `pageContentArticle` Blog record. */
export interface BlogArticleFields extends Record<string, unknown> {
    authors?: Array<BlogReference<BlogAuthorFields>>
    body?: BlogRichTextDocument
    cardImage?: BlogReference<CmsAssetFields>
    category?: BlogReference<BlogTaxonomyFields>
    heroMedia?: BlogReference<BlogComponentImageFields>
    name?: string
    publishedDate?: string
    snippet?: BlogRichTextDocument
    title: string
    topics?: Array<BlogReference<BlogTaxonomyFields>>
}

/** Fields stored for a routed `page` record wrapping a Blog article. */
export interface BlogPageFields extends Record<string, unknown> {
    content?: BlogReference<BlogArticleFields>
    url?: string
}

/** Responsive column counts authored in the Blog Page Cards entry. */
export interface BlogCardsPerRow {
    lg?: number
    md?: number
    sm?: number
    xs?: number
}

/** Optional filters supplied by the migrated Blog page-cards configuration. */
export interface BlogArticleFilters {
    articleIds?: string[]
    authorIds?: string[]
    cardsPerRow?: BlogCardsPerRow
    categoryIds?: string[]
    hideSnippet?: boolean
    limit?: number
    pageSize?: number
    topicIds?: string[]
}

/** One list article joined to the URL of the `page` that references it. */
export interface BlogListItem {
    article: CmsResource<BlogArticleFields>
    pageUrl?: string
}
