import type { FC } from 'react'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet'
import { Navigate, useParams } from 'react-router-dom'

import { useCmsCollection } from '~/libs/cms'

import { BlogPagination, BlogPostCard } from '../components'
import type { BlogPostFields } from '../models'
import { BLOG_PAGE_SIZE } from '../utils'
import styles from '../Blog.module.scss'

interface BlogListPageProps {
    pageOverride?: string
}

/**
 * Loads one page of public Blog posts directly from Payload CMS.
 *
 * @param props optional page supplied by the legacy `/blog/:page` route.
 * @returns the post list and community-app-compatible pagination controls.
 * @throws Does not throw; request failures are rendered inline.
 */
export const BlogListPage: FC<BlogListPageProps> = (props: BlogListPageProps) => {
    const params = useParams<{ page: string }>()
    const segment = props.pageOverride || params.page || '1'
    const page = /^\d+$/.test(segment) && Number(segment) > 0 ? Number(segment) : 1
    const query = useMemo(() => ({
        content_type: 'blogPost',
        'fields.title[exists]': true,
        include: 3,
        limit: BLOG_PAGE_SIZE,
        order: '-sys.createdAt',
        skip: (page - 1) * BLOG_PAGE_SIZE,
    }), [page])
    const posts = useCmsCollection<BlogPostFields>('default', query)
    const totalPages = Math.max(1, Math.ceil((posts.data?.total || 0) / BLOG_PAGE_SIZE))

    if (posts.data && page > totalPages) {
        return <Navigate replace to={totalPages === 1 ? '/blog' : `/blog/page/${totalPages}`} />
    }

    return (
        <main className={styles.blog}>
            <Helmet>
                <meta content='News, stories, and insights from Topcoder.' name='description' />
                <title>
                    Topcoder Blog
                    {page > 1 ? ` — Page ${page}` : ''}
                </title>
            </Helmet>
            <section className={styles.blogList}>
                {posts.loading && <div className={styles.pageState}>Loading Blog posts…</div>}
                {posts.error && <div className={styles.error}>{posts.error.message}</div>}
                {posts.data?.items.map(post => <BlogPostCard key={post.sys.id} post={post} />)}
                {posts.data && posts.data.items.length === 0 && (
                    <div className={styles.pageState}>No Blog posts are published yet.</div>
                )}
                {posts.data && posts.data.total > 0 && (
                    <BlogPagination page={page} totalPages={totalPages} />
                )}
            </section>
        </main>
    )
}
