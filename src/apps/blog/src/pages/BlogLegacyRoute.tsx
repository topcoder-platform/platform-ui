import type { FC } from 'react'
import { useParams } from 'react-router-dom'

import { BlogListPage } from './BlogListPage'
import { BlogPostPage } from './BlogPostPage'

/**
 * Preserves community-app Blog URLs where a page number and post slug shared one route segment.
 *
 * @returns a paginated list for numeric segments, otherwise the matching post.
 * @throws Does not throw.
 */
export const BlogLegacyRoute: FC = () => {
    const { slugOrPage = '' }: { slugOrPage?: string } = useParams<{ slugOrPage: string }>()
    return /^\d+$/.test(slugOrPage)
        ? <BlogListPage pageOverride={slugOrPage} />
        : <BlogPostPage slugOverride={slugOrPage} />
}
