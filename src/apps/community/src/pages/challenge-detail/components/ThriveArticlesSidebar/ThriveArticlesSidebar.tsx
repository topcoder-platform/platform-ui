import { FC, useMemo } from 'react'
import { Link } from 'react-router-dom'
import moment from 'moment'

import { rootRoute } from '../../../../config/routes.config'
import { ThriveArticle } from '../../../../lib'

import styles from './ThriveArticlesSidebar.module.scss'

interface ThriveArticlesSidebarProps {
    articles: ThriveArticle[]
}

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

/**
 * Renders up to three recommended Thrive article cards.
 *
 * @param props Thrive article list.
 * @returns Recommended article section.
 */
const ThriveArticlesSidebar: FC<ThriveArticlesSidebarProps> = (
    props: ThriveArticlesSidebarProps,
) => {
    const cards = useMemo(() => props.articles.slice(0, 3), [props.articles])

    if (!cards.length) {
        return <></>
    }

    return (
        <section className={styles.container} id='recommendedThriveArticles'>
            <header className={styles.header}>
                <h2 className={styles.title}>Recommended Thrive Articles</h2>
            </header>

            <div className={styles.cards}>
                {cards.map(article => {
                    const articlePath = withLeadingSlash(
                        `${rootRoute}/thrive/${encodeURIComponent(article.slug || article.title || article.id)}`
                            .replace(/\/{2,}/g, '/'),
                    )

                    return (
                        <article className={styles.card} key={article.id}>
                            {article.featuredImage && (
                                <Link className={styles.imageWrap} to={articlePath}>
                                    <img
                                        alt={article.title}
                                        className={styles.image}
                                        src={article.featuredImage}
                                    />
                                </Link>
                            )}

                            <div className={styles.content}>
                                <Link className={styles.cardTitle} to={articlePath}>
                                    {article.title}
                                </Link>
                                <p className={styles.meta}>
                                    {article.contentAuthor || 'Topcoder Thrive'}
                                    {article.creationDate
                                        ? ` • ${moment(article.creationDate)
                                            .format('MMM DD, YYYY')}`
                                        : ''}
                                </p>
                            </div>
                        </article>
                    )
                })}
            </div>
        </section>
    )
}

export default ThriveArticlesSidebar
