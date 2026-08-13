/* eslint-disable ordered-imports/ordered-imports */

import type { FC } from 'react'
import { Link } from 'react-router-dom'

import type { CmsResource } from '~/libs/cms'

import type { BlogArticleFields } from '../models'
import {
    formatBlogDate,
    getBlogAuthors,
    getBlogCardImageUrl,
    getBlogPostHref,
    getBlogTaxonomies,
    isResolvedBlogResource,
} from '../utils'
import { BlogRichText } from './BlogRichText'
import styles from '../Blog.module.scss'

interface BlogPostCardProps {
    hideSnippet?: boolean
    pageUrl?: string
    post: CmsResource<BlogArticleFields>
}

/**
 * Renders one migrated Blog article card using its joined routed Page URL.
 *
 * @param props article record, Page URL, and authored snippet visibility.
 * @returns a responsive card containing approved media, metadata, Rich Text snippet, and action.
 * @throws Does not throw; missing Page routes render non-linked article content.
 */
export const BlogPostCard: FC<BlogPostCardProps> = (props: BlogPostCardProps) => {
    const fields = props.post.fields
    const image = getBlogCardImageUrl(props.post)
    const href = getBlogPostHref(props.pageUrl)
    const authors = getBlogAuthors(fields.authors)
    const topics = getBlogTaxonomies(fields.topics)
    const category = isResolvedBlogResource(fields.category) ? fields.category : undefined
    const publishedDate = formatBlogDate(fields.publishedDate)
    const title = fields.title || fields.name || 'Blog article'

    return (
        <article className={styles.postCard}>
            {image && (
                href ? (
                    <Link aria-label={title} className={styles.cardImage} to={href}>
                        <img alt='' loading='lazy' src={image} />
                    </Link>
                ) : (
                    <div className={styles.cardImage}>
                        <img alt='' loading='lazy' src={image} />
                    </div>
                )
            )}
            <div className={styles.cardContent}>
                {(category || publishedDate) && (
                    <div className={styles.cardEyebrow}>
                        {category && <span>{category.fields.title}</span>}
                        {publishedDate && <time dateTime={fields.publishedDate}>{publishedDate}</time>}
                    </div>
                )}
                {href ? <Link to={href}><h2>{title}</h2></Link> : <h2>{title}</h2>}
                {authors.length > 0 && (
                    <div className={styles.cardAuthors}>
                        By
                        {' '}
                        {authors.map(author => author.fields.authorName)
                            .join(', ')}
                    </div>
                )}
                {!props.hideSnippet && fields.snippet && (
                    <BlogRichText className={styles.description} document={fields.snippet} />
                )}
                {topics.length > 0 && (
                    <div className={styles.tags}>
                        {topics.map(topic => <span key={topic.sys.id}>{topic.fields.title}</span>)}
                    </div>
                )}
                {href && <Link className={styles.readMore} to={href}>Read More</Link>}
            </div>
        </article>
    )
}
