import type { FC, ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet'
import { Link, useParams } from 'react-router-dom'

import type { CmsResource } from '~/libs/cms'
import {
    CmsMarkdown,
    getCmsResourceAssetUrl,
    getSafeCmsLink,
    useCmsCollection,
} from '~/libs/cms'

import { ThriveArticleCard } from '../../components'
import { THRIVE_DEFAULT_BANNER } from '../../config'
import type { ThriveArticleFields } from '../../models'
import {
    formatThriveDate,
    getMarkdownPreview,
    getThriveAuthors,
    getThriveCategories,
    getThriveExternalUrl,
    getThriveImageUrl,
    isResolvedCmsResource,
} from '../../utils'
import styles from '../../Thrive.module.scss'

interface MetadataProps {
    children: ReactNode
    label: string
}

/**
 * Renders one separated metadata group in the Thrive article sidebar.
 *
 * @param props uppercase group label and rendered metadata values.
 * @returns a bordered metadata section.
 * @throws Does not throw.
 */
const Metadata: FC<MetadataProps> = (props: MetadataProps) => (
    <section className={styles.metadata}>
        <h2>{props.label}</h2>
        <div>{props.children}</div>
    </section>
)

/**
 * Renders one migrated Thrive article selected by slug, with legacy-title URL compatibility.
 *
 * @returns article hero, metadata sidebar, markdown body, sharing actions, and recommendations.
 * @throws Does not throw; missing and failed records render a page state.
 */
export const ThriveArticlePage: FC = () => {
    const { slug = '' }: { slug?: string } = useParams<{ slug: string }>()
    const slugQuery = useMemo(() => ({
        content_type: 'article',
        'fields.slug': slug,
        include: 10,
        limit: 1,
    }), [slug])
    const slugResult = useCmsCollection<ThriveArticleFields>('edu', slugQuery)
    const needsTitleFallback = Boolean(slugResult.data && slugResult.data.total === 0)
    const titleQuery = useMemo(() => ({
        content_type: 'article',
        'fields.title[match]': slug,
        include: 10,
        limit: 10,
    }), [slug])
    const titleResult = useCmsCollection<ThriveArticleFields>('edu', titleQuery, needsTitleFallback)
    const article = slugResult.data?.items[0] || titleResult.data?.items.find(item => (
        item.fields.title === slug
        || encodeURIComponent(item.fields.title) === encodeURIComponent(slug)
    ))
    const error = slugResult.error || titleResult.error
    const loading = slugResult.loading || (needsTitleFallback && titleResult.loading)
    const externalUrl = article ? getThriveExternalUrl(article.fields) : undefined

    useEffect(() => {
        if (article?.fields.externalArticle && externalUrl) {
            window.location.assign(externalUrl)
        }
    }, [article, externalUrl])

    if (loading) {
        return <main className={styles.pageState}>Loading article…</main>
    }

    if (error) {
        return <main className={styles.pageState}>{error.message}</main>
    }

    if (!article) {
        return (
            <main className={styles.pageState}>
                <h1>Article not found</h1>
                <Link to='/thrive'>Return to Thrive</Link>
            </main>
        )
    }

    if (article.fields.externalArticle) {
        return externalUrl ? (
            <main className={styles.pageState}>Opening external article…</main>
        ) : (
            <main className={styles.pageState}>
                <h1>External article unavailable</h1>
                <p>The configured destination is unavailable or is not permitted.</p>
                <Link to='/thrive'>Return to Thrive</Link>
            </main>
        )
    }

    const fields = article.fields
    const authors = getThriveAuthors(fields)
    const categories = getThriveCategories(fields)
    const image = getThriveImageUrl(article) || THRIVE_DEFAULT_BANNER
    const recommended = (fields.recommended || [])
        .filter(isResolvedCmsResource<ThriveArticleFields>) as Array<CmsResource<ThriveArticleFields>>
    const shareUrl = encodeURIComponent(window.location.href)
    const videoUrl = getSafeCmsLink(fields.contentUrl)

    return (
        <main className={styles.articlePage}>
            <Helmet>
                <meta content={getMarkdownPreview(fields.content, 110)} name='description' />
                <meta content={image} property='og:image' />
                <title>{fields.title}</title>
            </Helmet>
            <header className={styles.articleHero}>
                <div>
                    <time>{formatThriveDate(fields.creationDate || article.sys.createdAt)}</time>
                    <h1>{fields.title}</h1>
                </div>
                <img alt='' src={image} />
            </header>
            <div className={styles.articleLayout}>
                <aside className={styles.articleSidebar}>
                    {authors.map(author => (
                        <div className={styles.author} key={author.sys.id}>
                            {getCmsResourceAssetUrl(author.fields.avatar) && (
                                <img alt='' src={getCmsResourceAssetUrl(author.fields.avatar)} />
                            )}
                            <div>
                                <strong>{author.fields.name}</strong>
                                {author.fields.tcHandle && <span>{author.fields.tcHandle}</span>}
                            </div>
                        </div>
                    ))}
                    {fields.readTime && <Metadata label='Duration'>{fields.readTime}</Metadata>}
                    <Metadata label='Categories'>
                        {categories.map(category => (
                            <Link
                                className={styles.pill}
                                key={category.sys.id}
                                to={`/thrive/tracks?track=${encodeURIComponent(category.fields.trackParent)}`
                                    + `&tax=${encodeURIComponent(category.fields.name)}`}
                            >
                                {category.fields.name}
                            </Link>
                        ))}
                    </Metadata>
                    <Metadata label='Tags'>
                        {fields.tags?.map(tag => (
                            <Link
                                className={styles.pill}
                                key={tag}
                                to={`/thrive/search?tags=${encodeURIComponent(tag)}`}
                            >
                                {tag}
                            </Link>
                        ))}
                    </Metadata>
                    <Metadata label='Share'>
                        <div className={styles.shareLinks}>
                            <a
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                                rel='noreferrer'
                                target='_blank'
                            >
                                in
                            </a>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                                rel='noreferrer'
                                target='_blank'
                            >
                                f
                            </a>
                            <a
                                href={`https://twitter.com/intent/tweet?url=${shareUrl}`}
                                rel='noreferrer'
                                target='_blank'
                            >
                                𝕏
                            </a>
                        </div>
                    </Metadata>
                </aside>
                <article className={styles.articleContent}>
                    <CmsMarkdown>{fields.content}</CmsMarkdown>
                    {fields.type === 'Video' && videoUrl && (
                        <a
                            className={styles.videoLink}
                            href={videoUrl}
                            rel='noreferrer'
                            target='_blank'
                        >
                            Watch video
                        </a>
                    )}
                    <div className={styles.voteSummary}>
                        <span>
                            ♥
                            {fields.upvotes || 0}
                        </span>
                        <span>
                            ♡
                            {fields.downvotes || 0}
                        </span>
                    </div>
                    <a
                        className={styles.discordButton}
                        href='https://discord.gg/topcoder?ref=thrive-article'
                        rel='noreferrer'
                        target='_blank'
                    >
                        Chat on Discord
                    </a>
                </article>
            </div>
            {recommended.length > 0 && (
                <section className={styles.recommended}>
                    <h2>Recommended for you</h2>
                    <div className={styles.homeCards}>
                        {recommended.map(item => (
                            <ThriveArticleCard article={item} compact key={item.sys.id} />
                        ))}
                    </div>
                </section>
            )}
        </main>
    )
}
