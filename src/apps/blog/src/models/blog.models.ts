import type { CmsLink, CmsResource } from '~/libs/cms'

/** Linked Blog value after Payload compatibility relationship resolution. */
export type BlogReference<Fields extends Record<string, unknown>> = CmsLink | CmsResource<Fields>

/** Fields stored for a Blog author record. */
export interface BlogAuthorFields extends Record<string, unknown> {
    name: string
}

/** Fields stored for a public Blog post. */
export interface BlogPostFields extends Record<string, unknown> {
    author?: BlogReference<BlogAuthorFields>
    body?: string
    description?: string
    heroImage?: BlogReference<Record<string, unknown>>
    relatedPosts?: Array<BlogReference<BlogPostFields>>
    slug: string
    tags?: string[]
    theme?: string
    title: string
}
