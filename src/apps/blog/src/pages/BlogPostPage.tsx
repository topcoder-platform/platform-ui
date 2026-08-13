import type { FC } from 'react'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet'
import { Link, useParams } from 'react-router-dom'

import { useCmsCollection } from '~/libs/cms'

import { BlogRichText } from '../components'
import type { BlogPageFields } from '../models'
import {
    buildBlogDetailQuery,
    formatBlogDate,
    getBlogAuthors,
    getBlogHeroUrl,
    getBlogRichTextPlainText,
    getBlogTaxonomies,
    isResolvedBlogResource,
    selectBlogArticlePage,
} from '../utils'
import styles from '../Blog.module.scss'

interface BlogPostPageProps {
    slugOverride?: string
}

/**
 * Loads a routed Page and renders its resolved `pageContentArticle` Rich Text content.
 *
 * @param props optional slug supplied by the legacy `/blog/:slug` route.
 * @returns the article header, approved hero media, taxonomy, and safely rendered Rich Text body.
 * @throws Does not throw; unresolved or incorrectly typed Page content renders a not-found state.
 */
export const BlogPostPage: FC<BlogPostPageProps> = (props: BlogPostPageProps) => {
    const params = useParams<{ slug: string }>()
    const slug = props.slugOverride || params.slug || ''
    const query = useMemo(() => buildBlogDetailQuery(slug), [slug])
    const result = useCmsCollection<BlogPageFields>('website', query, Boolean(slug))
    const selected = useMemo(
        () => selectBlogArticlePage(result.data?.items || [], slug),
        [result.data, slug],
    )

    if (result.loading) {
        return <main className={styles.pageState}>Loading Blog post…</main>
    }

    if (result.error) {
        return <main className={styles.error}>{result.error.message}</main>
    }

    if (!selected) {
        return (
            <main className={styles.pageState}>
                <h1>Blog post not found</h1>
                <Link to='/blog'>Return to Blog</Link>
            </main>
        )
    }

    const fields = selected.article.fields
    const title = fields.title || fields.name || 'Blog article'
    const heroImage = getBlogHeroUrl(selected.article)
    const authors = getBlogAuthors(fields.authors)
    const category = isResolvedBlogResource(fields.category) ? fields.category : undefined
    const topics = getBlogTaxonomies(fields.topics)
    const publishedDate = formatBlogDate(fields.publishedDate)
    const description = getBlogRichTextPlainText(fields.snippet)
        .slice(0, 180)

    return (
        <main className={styles.blogPost}>
            <Helmet>
                {description && <meta content={description} name='description' />}
                {heroImage && <meta content={heroImage} property='og:image' />}
                <title>
                    {title}
                    {' '}
                    | Topcoder Blog
                </title>
            </Helmet>
            <article className={styles.postContentWrapper}>
                <header className={styles.postHeader}>
                    <Link aria-label='Back to Blog' className={styles.back} to='/blog'>←</Link>
                    <div>
                        {category && <div className={styles.postCategory}>{category.fields.title}</div>}
                        <h1>{title}</h1>
                        <div className={styles.postMeta}>
                            {authors.length > 0 && (
                                <span>
                                    By
                                    {' '}
                                    {authors.map(author => author.fields.authorName)
                                        .join(', ')}
                                </span>
                            )}
                            {publishedDate && (
                                <time dateTime={fields.publishedDate}>{publishedDate}</time>
                            )}
                        </div>
                        {topics.length > 0 && (
                            <div className={styles.tags}>
                                {topics.map(topic => <span key={topic.sys.id}>{topic.fields.title}</span>)}
                            </div>
                        )}
                    </div>
                </header>
                {heroImage && <img alt={title} className={styles.heroImage} src={heroImage} />}
                <BlogRichText className={styles.richText} document={fields.body} />
            </article>
        </main>
    )
}
