import type { FC } from 'react'
import { Link } from 'react-router-dom'

import type { CmsResource } from '~/libs/cms'
import { CmsMarkdown } from '~/libs/cms'

import type { BlogPostFields } from '../models'
import { getBlogHeroUrl } from '../utils'
import styles from '../Blog.module.scss'

interface BlogPostCardProps {
    post: CmsResource<BlogPostFields>
    related?: boolean
}

/**
 * Renders the community-app Blog list treatment for one Payload-hosted post.
 *
 * @param props post record plus the optional compact related-post treatment.
 * @returns linked hero image, title, description, and read-more action.
 * @throws Does not throw.
 */
export const BlogPostCard: FC<BlogPostCardProps> = (props: BlogPostCardProps) => {
    const image = getBlogHeroUrl(props.post)
    const href = `/blog/post/${encodeURIComponent(props.post.fields.slug)}`

    return (
        <article className={props.related ? styles.relatedCard : styles.postCard}>
            {image && (
                <Link className={styles.cardImage} to={href}>
                    <img alt={props.post.fields.title} loading='lazy' src={image} />
                </Link>
            )}
            <div className={styles.cardContent}>
                <Link to={href}><h1>{props.post.fields.title}</h1></Link>
                {props.post.fields.description && (
                    <CmsMarkdown className={styles.description}>{props.post.fields.description}</CmsMarkdown>
                )}
                <Link className={styles.readMore} to={href}>Read More</Link>
            </div>
        </article>
    )
}
