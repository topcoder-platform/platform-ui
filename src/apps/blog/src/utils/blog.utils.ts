import type { CmsResource } from '~/libs/cms'
import { getCmsResourceAssetUrl } from '~/libs/cms'

import type { BlogAuthorFields, BlogPostFields, BlogReference } from '../models'

/** Number of posts retained from the community-app Blog page. */
export const BLOG_PAGE_SIZE = 10

/**
 * Identifies a linked Blog value that Payload's compatibility response resolved.
 *
 * @param value retained link or resolved record.
 * @returns true when the value embeds fields.
 * @throws Does not throw.
 */
export function isResolvedBlogResource<Fields extends Record<string, unknown>>(
    value: BlogReference<Fields> | undefined,
): value is CmsResource<Fields> {
    return Boolean(value && 'fields' in value)
}

/**
 * Returns an approved migrated hero-image URL for a Blog post.
 *
 * @param post Blog fields or full CMS record.
 * @returns an assets.topcoder-dev.com URL, or undefined when no safe image exists.
 * @throws Does not throw.
 */
export function getBlogHeroUrl(post: BlogPostFields | CmsResource<BlogPostFields>): string | undefined {
    const fields: BlogPostFields = 'fields' in post && 'sys' in post
        ? (post as CmsResource<BlogPostFields>).fields
        : post as BlogPostFields
    return getCmsResourceAssetUrl(fields.heroImage)
}

/**
 * Reads an embedded author name from a resolved Blog relationship.
 *
 * @param author resolved or retained author relationship.
 * @returns the author name, or an empty string while unavailable.
 * @throws Does not throw.
 */
export function getBlogAuthorName(author: BlogReference<BlogAuthorFields> | undefined): string {
    return isResolvedBlogResource(author) ? author.fields.name : ''
}

/**
 * Formats Blog update metadata using the legacy weekday/month presentation.
 *
 * @param value retained CMS update timestamp.
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
 * @param total total number of matching Blog posts.
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
