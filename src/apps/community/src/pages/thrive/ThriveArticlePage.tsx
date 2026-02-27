import { marked } from 'marked'
import { FC, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import moment from 'moment'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    LoadingSpinner,
} from '~/libs/ui'

import { rootRoute } from '../../config/routes.config'
import {
    useThriveArticle,
    UseThriveArticleResult,
} from '../../lib'

import styles from './ThriveArticlePage.module.scss'

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

/**
 * Thrive article detail page.
 *
 * @returns Thrive article content by route slug.
 */
const ThriveArticlePage: FC = () => {
    const { articleTitle }: { articleTitle?: string } = useParams<{ articleTitle: string }>()
    const {
        article,
        isLoading,
    }: UseThriveArticleResult = useThriveArticle(articleTitle)

    const communityPath = rootRoute || '/'
    const thrivePath = withLeadingSlash(`${rootRoute}/thrive`)
        .replace(/\/{2,}/g, '/')
    const breadcrumbs = useMemo<Array<BreadcrumbItemModel>>(() => [
        {
            name: 'Community',
            url: communityPath,
        },
        {
            name: 'Thrive',
            url: thrivePath,
        },
        {
            name: article?.title || articleTitle || 'Article',
            url: withLeadingSlash(`${rootRoute}/thrive/${encodeURIComponent(articleTitle ?? '')}`)
                .replace(/\/{2,}/g, '/'),
        },
    ], [article?.title, articleTitle, communityPath, thrivePath])

    const articleBodyHtml = useMemo(() => {
        if (!article?.body) {
            return ''
        }

        return DOMPurify.sanitize(marked.parse(article.body) as string)
    }, [article?.body])

    const creationDateLabel = useMemo(() => {
        if (!article?.creationDate) {
            return ''
        }

        const value = moment(article.creationDate)

        return value.isValid()
            ? value.format('MMM DD, YYYY')
            : ''
    }, [article?.creationDate])

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <LoadingSpinner />
            </div>
        )
    }

    if (!article) {
        return (
            <section className={styles.page}>
                <Breadcrumb
                    items={breadcrumbs}
                    renderInline
                />
                <p className={styles.notFound}>Article not found</p>
            </section>
        )
    }

    return (
        <section className={styles.page}>
            <Breadcrumb
                items={breadcrumbs}
                renderInline
            />

            <article className={styles.article}>
                {article.featuredImage && (
                    <img
                        alt={article.title}
                        className={styles.featuredImage}
                        src={article.featuredImage}
                    />
                )}

                <h1 className={styles.title}>{article.title}</h1>

                {(article.contentAuthor || creationDateLabel) && (
                    <p className={styles.meta}>
                        {article.contentAuthor || 'Topcoder Thrive'}
                        {creationDateLabel ? ` • ${creationDateLabel}` : ''}
                    </p>
                )}

                {article.tags.length > 0 && (
                    <div className={styles.tags}>
                        {article.tags.map(tag => (
                            <span className={styles.tag} key={`${article.id}-${tag}`}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div
                    className={styles.body}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: articleBodyHtml }}
                />
            </article>
        </section>
    )
}

export default ThriveArticlePage
