import type { FC } from 'react'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet'
import { Link, useParams } from 'react-router-dom'

import type { CmsResource } from '~/libs/cms'
import { CmsMarkdown, useCmsCollection } from '~/libs/cms'

import { BlogPostCard } from '../components'
import type { BlogPostFields } from '../models'
import {
    formatBlogDate,
    getBlogAuthorName,
    getBlogHeroUrl,
    isResolvedBlogResource,
} from '../utils'
import styles from '../Blog.module.scss'

interface BlogPostPageProps {
    slugOverride?: string
}

/**
 * Loads and renders one public Payload-hosted Blog post selected by slug.
 *
 * @param props optional slug supplied by the legacy `/blog/:slug` route.
 * @returns the post header, metadata, image, markdown body, and related posts.
 * @throws Does not throw; missing or failed records render a page state.
 */
export const BlogPostPage: FC<BlogPostPageProps> = (props: BlogPostPageProps) => {
    const params = useParams<{ slug: string }>()
    const slug = props.slugOverride || params.slug || ''
    const query = useMemo(() => ({
        content_type: 'blogPost',
        'fields.slug': slug,
        'fields.title[exists]': true,
        include: 10,
        limit: 1,
    }), [slug])
    const result = useCmsCollection<BlogPostFields>('default', query)
    const post = result.data?.items[0]

    if (result.loading) {
        return <main className={styles.pageState}>Loading Blog post…</main>
    }

    if (result.error) {
        return <main className={styles.error}>{result.error.message}</main>
    }

    if (!post) {
        return (
            <main className={styles.pageState}>
                <h1>Blog post not found</h1>
                <Link to='/blog'>Return to Blog</Link>
            </main>
        )
    }

    const fields = post.fields
    const heroImage = getBlogHeroUrl(post)
    const relatedPosts = (fields.relatedPosts || [])
        .filter(isResolvedBlogResource<BlogPostFields>) as Array<CmsResource<BlogPostFields>>

    return (
        <main className={styles.blogPost}>
            <Helmet>
                {fields.description && <meta content={fields.description.slice(0, 180)} name='description' />}
                {heroImage && <meta content={heroImage} property='og:image' />}
                <title>
                    {fields.title}
                    {' '}
                    | Topcoder Blog
                </title>
            </Helmet>
            <article className={styles.postContentWrapper}>
                <header className={styles.postHeader}>
                    <Link aria-label='Back to Blog' className={styles.back} to='/blog'>←</Link>
                    <div>
                        <h1>{fields.title}</h1>
                        <div className={styles.postMeta}>
                            {getBlogAuthorName(fields.author) && (
                                <span>
                                    ●
                                    {getBlogAuthorName(fields.author)}
                                </span>
                            )}
                            <time>
                                ●
                                {formatBlogDate(post.sys.updatedAt)}
                            </time>
                        </div>
                        {fields.tags && (
                            <div className={styles.tags}>
                                {fields.tags.map(tag => <span key={tag}>{tag}</span>)}
                            </div>
                        )}
                    </div>
                </header>
                {heroImage && <img alt={fields.title} className={styles.heroImage} src={heroImage} />}
                <div className={styles.markdown}>
                    {fields.description && <CmsMarkdown>{fields.description}</CmsMarkdown>}
                    {fields.body && <CmsMarkdown>{fields.body}</CmsMarkdown>}
                </div>
                {relatedPosts.length > 0 && (
                    <section className={styles.related}>
                        <h2>Related Posts</h2>
                        <div>
                            {relatedPosts.map(related => (
                                <BlogPostCard key={related.sys.id} post={related} related />
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </main>
    )
}
