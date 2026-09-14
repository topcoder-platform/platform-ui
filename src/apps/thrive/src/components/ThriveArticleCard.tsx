import type { FC } from 'react'
import { Link } from 'react-router-dom'

import type { CmsResource } from '~/libs/cms'

import type { ThriveArticleFields } from '../models'
import {
    formatThriveDate,
    getMarkdownPreview,
    getThriveArticleUrl,
    getThriveAuthors,
    getThriveExternalUrl,
    getThriveImageUrl,
} from '../utils'
import styles from '../Thrive.module.scss'

interface ThriveArticleCardProps {
    article: CmsResource<ThriveArticleFields>
    compact?: boolean
}

/**
 * Renders a Thrive article, video, or forum-post summary using resolved Payload relationships.
 *
 * @param props CMS article record and optional compact home-page treatment.
 * @returns an accessible card linked to the local article route or its configured external URL.
 * @throws URIError only when an invalid legacy article title cannot be encoded.
 */
export const ThriveArticleCard: FC<ThriveArticleCardProps> = (props: ThriveArticleCardProps) => {
    const fields = props.article.fields
    const authors = getThriveAuthors(fields)
    const href = getThriveArticleUrl(fields)
    const image = getThriveImageUrl(props.article)
    const external = Boolean(getThriveExternalUrl(fields))
    const content = (
        <>
            {image && <img alt='' className={styles.cardImage} loading='lazy' src={image} />}
            <div className={styles.cardBody}>
                <div className={styles.cardType}>{fields.type}</div>
                <h3>{fields.title}</h3>
                {!props.compact && <p>{getMarkdownPreview(fields.content, 180)}</p>}
                <div className={styles.cardMeta}>
                    <span>
                        {authors.map(author => author.fields.name)
                            .join(', ')}
                    </span>
                    <span>{formatThriveDate(fields.creationDate || props.article.sys.createdAt)}</span>
                    {fields.readTime && <span>{fields.readTime}</span>}
                </div>
                {!props.compact && (
                    <div className={styles.cardStats}>
                        <span aria-label={`${fields.upvotes || 0} likes`}>
                            ♥
                            {fields.upvotes || 0}
                        </span>
                        <span aria-label={`${fields.commentsCount || 0} comments`}>
                            ◌
                            {' '}
                            {fields.commentsCount || 0}
                        </span>
                    </div>
                )}
            </div>
        </>
    )

    return external ? (
        <a
            className={props.compact ? styles.smallCard : styles.resultCard}
            href={href}
            rel='noreferrer'
            target='_blank'
        >
            {content}
        </a>
    ) : (
        <Link className={props.compact ? styles.smallCard : styles.resultCard} to={href}>
            {content}
        </Link>
    )
}
