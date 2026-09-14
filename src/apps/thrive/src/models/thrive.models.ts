import { CmsLink, CmsResource } from '~/libs/cms'

/** Thrive content types retained from the EDU CMS space. */
export type ThriveContentType = 'Article' | 'Forum post' | 'Video'

/** Linked CMS value after compatibility-link resolution. */
export type ThriveReference<Fields extends Record<string, unknown>> = CmsLink | CmsResource<Fields>

/** Fields stored for a Thrive content taxonomy record. */
export interface ThriveCategoryFields extends Record<string, unknown> {
    name: string
    trackParent: string
}

/** Fields stored for a Thrive content author. */
export interface ThrivePersonFields extends Record<string, unknown> {
    avatar?: ThriveReference<Record<string, unknown>>
    name: string
    tcHandle?: string
}

/** Fields stored for a Thrive Article, Video, or Forum post record. */
export interface ThriveArticleFields extends Record<string, unknown> {
    commentsCount?: number
    content: string
    contentAuthor?: Array<ThriveReference<ThrivePersonFields>>
    contentCategory?: Array<ThriveReference<ThriveCategoryFields>>
    contentUrl?: string
    creationDate?: string
    downvotes?: number
    externalArticle?: boolean
    featuredImage?: ThriveReference<Record<string, unknown>>
    openExternalLinksInNewTab?: boolean
    readTime?: string
    recommended?: Array<ThriveReference<ThriveArticleFields>>
    slug?: string
    tags?: string[]
    title: string
    trackCategory?: string | string[]
    type: ThriveContentType
    upvotes?: number
}

/** One supported Thrive track and its legacy visual treatment. */
export interface ThriveTrack {
    accent: string
    banner: string
    icon: string
    name: string
}

/** Route-driven filters shared by the Thrive Tracks and Search pages. */
export interface ThriveFilters {
    author?: string
    endDate?: string
    phrase?: string
    sortBy?: 'Content Publish Date' | 'Likes'
    startDate?: string
    tags: string[]
    tax?: string[]
    title?: string
    track?: string
}
