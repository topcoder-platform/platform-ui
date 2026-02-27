import { FC } from 'react'
import { Link } from 'react-router-dom'

import { LoadingSpinner } from '~/libs/ui'

import { rootRoute } from '../../../../config/routes.config'
import {
    useThriveArticles,
    UseThriveArticlesResult,
} from '../../../../lib'

import styles from './ThriveArticlesFeedPanel.module.scss'

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

/**
 * Displays a feed of Thrive article links.
 *
 * @returns Thrive article feed panel content.
 */
const ThriveArticlesFeedPanel: FC = () => {
    const {
        articles,
        isLoading,
    }: UseThriveArticlesResult = useThriveArticles({ limit: 5 })
    const thrivePath = withLeadingSlash(`${rootRoute}/thrive`)
        .replace(/\/{2,}/g, '/')

    return (
        <section className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.title}>Thrive Articles</h2>
                <Link
                    className={styles.viewAll}
                    to={thrivePath}
                >
                    View all
                </Link>
            </header>

            {isLoading && (
                <div className={styles.loading}>
                    <LoadingSpinner inline />
                </div>
            )}

            {!isLoading && (
                <div className={styles.rows}>
                    {articles.map(article => {
                        const articlePath = withLeadingSlash(
                            `${rootRoute}/thrive/${encodeURIComponent(article.slug || article.title)}`,
                        )
                            .replace(/\/{2,}/g, '/')

                        return (
                            <article className={styles.row} key={article.id}>
                                <Link className={styles.articleName} to={articlePath}>
                                    {article.title}
                                </Link>
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

export default ThriveArticlesFeedPanel
