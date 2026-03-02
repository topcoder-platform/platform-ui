import { FC, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import moment from 'moment'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    LoadingSpinner,
} from '~/libs/ui'

import { rootRoute } from '../../config/routes.config'
import {
    ThriveArticle,
    useThriveArticles,
    UseThriveArticlesResult,
} from '../../lib'

import styles from './ThriveListingPage.module.scss'

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

function buildArticlePath(article: ThriveArticle): string {
    return withLeadingSlash(
        `${rootRoute}/thrive/${encodeURIComponent(article.slug || article.title || article.id)}`,
    )
        .replace(/\/{2,}/g, '/')
}

function normalizeQueryValues(values: string[]): string[] {
    return Array.from(
        new Set(
            values
                .flatMap(value => value.split(','))
                .map(value => value.trim())
                .filter(Boolean),
        ),
    )
}

function articleMatchesTaxonomy(article: ThriveArticle, taxonomies: string[]): boolean {
    if (!taxonomies.length) {
        return true
    }

    const normalizedTaxonomies = taxonomies.map(taxonomy => taxonomy.toLocaleLowerCase())
    return article.contentCategory.some(category => normalizedTaxonomies.includes(
        category.name.toLocaleLowerCase(),
    ))
}

/**
 * Thrive article listing and search page.
 *
 * Supports the route shapes `/thrive`, `/thrive/tracks`, and `/thrive/search`.
 *
 * @returns Query-driven list of Thrive articles.
 */
const ThriveListingPage: FC = () => {
    const [searchParams] = useSearchParams()
    const communityPath = rootRoute || '/'
    const thrivePath = withLeadingSlash(`${rootRoute}/thrive`)
        .replace(/\/{2,}/g, '/')
    const track = (searchParams.get('track') || '').trim()
    const tags = useMemo<string[]>(
        () => normalizeQueryValues(searchParams.getAll('tags')),
        [searchParams],
    )
    const taxonomies = useMemo<string[]>(
        () => normalizeQueryValues(searchParams.getAll('tax')),
        [searchParams],
    )
    const thriveQuery = useMemo(() => ({
        limit: 100,
        ...(track ? { track } : {}),
        ...(tags.length ? { tags } : {}),
    }), [tags, track])
    const {
        articles,
        isLoading,
    }: UseThriveArticlesResult = useThriveArticles(thriveQuery)
    const filteredArticles = useMemo<ThriveArticle[]>(
        () => articles.filter(article => articleMatchesTaxonomy(article, taxonomies)),
        [articles, taxonomies],
    )
    const heading = useMemo<string>(() => {
        if (track && taxonomies.length) {
            return `${track} · ${taxonomies.join(', ')}`
        }

        if (track) {
            return track
        }

        if (tags.length) {
            return `Tag: ${tags.join(', ')}`
        }

        return 'All Thrive Articles'
    }, [tags, taxonomies, track])
    const breadcrumbs = useMemo<Array<BreadcrumbItemModel>>(() => [
        {
            name: 'Community',
            url: communityPath,
        },
        {
            name: 'Thrive',
            url: thrivePath,
        },
    ], [communityPath, thrivePath])

    return (
        <section className={styles.wrapper}>
            <Breadcrumb
                items={breadcrumbs}
                renderInline
            />

            <header className={styles.header}>
                <h1 className={styles.heading}>{heading}</h1>
                <p className={styles.subheading}>
                    {filteredArticles.length}
                    {' '}
                    article
                    {filteredArticles.length === 1 ? '' : 's'}
                </p>
            </header>

            {isLoading && (
                <div className={styles.loading}>
                    <LoadingSpinner />
                </div>
            )}

            {!isLoading && (
                <div className={styles.list}>
                    {filteredArticles.map(article => (
                        <article className={styles.articleCard} key={article.id}>
                            <h2 className={styles.articleTitle}>
                                <Link to={buildArticlePath(article)}>
                                    {article.title}
                                </Link>
                            </h2>
                            <p className={styles.meta}>
                                {article.contentAuthor || 'Topcoder Thrive'}
                                {article.creationDate
                                    ? ` · ${moment(article.creationDate)
                                        .format('MMM D, YYYY')}`
                                    : ''}
                            </p>
                            <p className={styles.excerpt}>
                                {(article.body || '')
                                    .replace(/\s+/g, ' ')
                                    .trim()
                                    .slice(0, 220)}
                                {(article.body || '').length > 220 ? '...' : ''}
                            </p>
                        </article>
                    ))}
                    {!filteredArticles.length && (
                        <p className={styles.emptyState}>No Thrive articles found for this filter.</p>
                    )}
                </div>
            )}
        </section>
    )
}

export default ThriveListingPage
