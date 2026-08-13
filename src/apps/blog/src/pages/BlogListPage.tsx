import type { FC } from 'react'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet'
import { Navigate, useParams } from 'react-router-dom'

import type { CmsResource } from '~/libs/cms'
import { useCmsCollection } from '~/libs/cms'

import { BlogPagination, BlogPostCard } from '../components'
import type { BlogArticleFields, BlogPageFields } from '../models'
import {
    BLOG_ROOT_PAGE_ID,
    buildBlogArticleQuery,
    buildBlogPageLookupQuery,
    getBlogCardsPerRow,
    getBlogLimitedTotal,
    getBlogPageCardFilters,
    getBlogPageSize,
    joinBlogArticlesToPages,
} from '../utils'
import styles from '../Blog.module.scss'

interface BlogListPageProps {
    pageOverride?: string
}

/**
 * Loads one ordered page of Blog articles and joins their separately stored Page URLs.
 *
 * @param props optional page supplied by the legacy `/blog/:page` route.
 * @returns the migrated three-column card list and community-app-compatible pagination controls.
 * @throws Does not throw; request failures are rendered inline.
 */
export const BlogListPage: FC<BlogListPageProps> = (props: BlogListPageProps) => {
    const params = useParams<{ page: string }>()
    const segment = props.pageOverride || params.page || '1'
    const page = /^\d+$/.test(segment) && Number(segment) > 0 ? Number(segment) : 1
    const rootQuery = useMemo(() => ({
        content_type: 'page',
        include: 10,
        limit: 1,
        'sys.id': BLOG_ROOT_PAGE_ID,
    }), [])
    const rootPage = useCmsCollection<Record<string, unknown>>('website', rootQuery)
    const filters = useMemo(
        () => getBlogPageCardFilters(rootPage.data?.items[0] as CmsResource | undefined),
        [rootPage.data],
    )
    const articleQuery = useMemo(() => buildBlogArticleQuery(page, filters), [filters, page])
    const articles = useCmsCollection<BlogArticleFields>('website', articleQuery, !rootPage.loading)
    const articleIds = useMemo(
        () => (articles.data?.items || []).map(article => article.sys.id),
        [articles.data],
    )
    const pageQuery = useMemo(() => buildBlogPageLookupQuery(articleIds), [articleIds])
    const pages = useCmsCollection<BlogPageFields>('website', pageQuery, articleIds.length > 0)
    const joined = useMemo(
        () => {
            if (!articles.data) {
                return undefined
            }

            const result = joinBlogArticlesToPages(articles.data, pages.data?.items || [])
            return {
                ...result,
                total: getBlogLimitedTotal(result.total, filters),
            }
        },
        [articles.data, filters, pages.data],
    )
    const pageSize = getBlogPageSize(filters)
    const totalPages = filters.limit ? 1 : Math.max(1, Math.ceil((joined?.total || 0) / pageSize))
    const columns = getBlogCardsPerRow(filters)
    const loading = rootPage.loading || articles.loading || (articleIds.length > 0 && pages.loading)
    const error = rootPage.error || articles.error || pages.error

    if (joined && page > totalPages) {
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
                {loading && <div className={styles.pageState}>Loading Blog posts…</div>}
                {error && <div className={styles.error}>{error.message}</div>}
                {joined && !loading && !error && (
                    <div
                        className={styles.postGrid}
                        data-columns-lg={columns.lg}
                        data-columns-md={columns.md}
                        data-columns-sm={columns.sm}
                        data-columns-xs={columns.xs}
                    >
                        {joined.items.map(item => (
                            <BlogPostCard
                                hideSnippet={filters.hideSnippet}
                                key={item.article.sys.id}
                                pageUrl={item.pageUrl}
                                post={item.article}
                            />
                        ))}
                    </div>
                )}
                {joined && !loading && !error && joined.items.length === 0 && (
                    <div className={styles.pageState}>No Blog posts are published yet.</div>
                )}
                {joined && !loading && !error && joined.total > pageSize && !filters.limit && (
                    <BlogPagination page={page} totalPages={totalPages} />
                )}
            </section>
        </main>
    )
}
