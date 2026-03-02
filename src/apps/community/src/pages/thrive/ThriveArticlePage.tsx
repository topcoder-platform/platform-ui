import { marked } from 'marked'
import {
    FC,
    MouseEvent,
    useCallback,
    useEffect,
    useMemo,
} from 'react'
import { Link, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import moment from 'moment'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    LoadingSpinner,
} from '~/libs/ui'

import {
    rootRoute,
    thriveListingRouteId,
    thriveSearchRouteId,
    thriveTracksRouteId,
} from '../../config/routes.config'
import {
    ContentCategory,
    ThriveStructuredEntry,
    useThriveArticle,
    UseThriveArticleResult,
} from '../../lib'

import styles from './ThriveArticlePage.module.scss'

const DEFAULT_BANNER_IMAGE
    = 'https://images.ctfassets.net/piwi0eufbb2g/'
        + '7v2hlDsVep7FWufHw0lXpQ/2505e61a880e68fab4e80cd0e8ec1814/'
        + '0C37CB5E-B253-4804-8935-78E64E67589E.png?w=1200&h=630'
const THRIVE_BANNER_BOTTOM_SHAPE
    = 'https://images.ctfassets.net/piwi0eufbb2g/'
        + '3StLyQh5ne1Lk9H7C1oVxv/52f17a02122212052e44585d3e79fcf7/'
        + '29320408-E820-48E1-B0FD-539EAC296910.svg'
const THRIVE_BANNER_CLIP_PATH
    = 'M0.477,1 C0.72,0.999,1,0.804,1,0.56 C1,0.316,0.766,-0.067,0.528,0.021 '
        + 'C0.343,0.089,0.145,-0.088,0.076,0.063 C0.016,0.193,-0.071,0.456,0.101,0.618 '
        + 'C0.274,0.782,0.234,1,0.477,1'
const VIDEO_IFRAME_ALLOW
    = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; '
        + 'picture-in-picture; web-share'

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

function buildThrivePath(routeId: string, params?: Record<string, string>): string {
    const basePath = withLeadingSlash(`${rootRoute}/${routeId}`)
        .replace(/\/{2,}/g, '/')

    if (!params || !Object.keys(params).length) {
        return basePath
    }

    const query = new URLSearchParams(params)
    return `${basePath}?${query.toString()}`
}

function buildArticlePath(slugOrTitle: string): string {
    return withLeadingSlash(`${rootRoute}/thrive/${encodeURIComponent(slugOrTitle)}`)
        .replace(/\/{2,}/g, '/')
}

function getYouTubeEmbedUrl(url: string): string {
    if (!url) {
        return ''
    }

    try {
        const parsed = new URL(url)
        const videoId = parsed.searchParams.get('v')

        if (parsed.hostname.includes('youtu.be')) {
            const shortenedId = parsed.pathname.replace('/', '')
            return shortenedId
                ? `https://www.youtube.com/embed/${shortenedId}`
                : ''
        }

        if (parsed.hostname.includes('youtube.com') && parsed.pathname.startsWith('/embed/')) {
            return url
        }

        if (parsed.hostname.includes('youtube.com') && videoId) {
            return `https://www.youtube.com/embed/${videoId}`
        }
    } catch {
        return ''
    }

    return ''
}

function toSafeHtml(markdownContent: string): string {
    if (!markdownContent) {
        return ''
    }

    return DOMPurify.sanitize(marked.parse(markdownContent) as string)
}

interface StructuredEntryRendererProps {
    entry: ThriveStructuredEntry
}

/**
 * Recursively renders supported Contentful structured entries.
 *
 * @param props Structured entry payload.
 * @returns Rendered entry node.
 */
// eslint-disable-next-line complexity
const StructuredEntryRenderer: FC<StructuredEntryRendererProps> = (
    props: StructuredEntryRendererProps,
) => {
    switch (props.entry.type) {
        case 'viewport': {

            if (!props.entry.items.length) {
                return <></>
            }

            return (
                <div className={styles.structuredViewport} data-theme={props.entry.theme || undefined}>
                    {props.entry.items.map(item => (
                        <StructuredEntryRenderer entry={item} key={item.id} />
                    ))}
                </div>
            )
        }

        case 'contentBlock': {

            return (
                <div
                    className={styles.structuredContentBlock}
                    data-theme={props.entry.baseTheme || undefined}
                >
                    {props.entry.imageUrl && (
                        <img
                            alt='Thrive content block'
                            className={styles.structuredImage}
                            src={props.entry.imageUrl}
                        />
                    )}
                    {props.entry.text && (
                        <div
                            className={styles.structuredMarkdown}
                            // eslint-disable-next-line react/no-danger
                            dangerouslySetInnerHTML={{ __html: toSafeHtml(props.entry.text) }}
                        />
                    )}
                </div>
            )
        }

        case 'banner': {

            const bannerStyle = props.entry.backgroundImageUrl
                ? {
                    backgroundImage: `url(${props.entry.backgroundImageUrl})`,
                }
                : undefined

            return (
                <section
                    className={styles.structuredBanner}
                    data-theme={props.entry.baseTheme || undefined}
                    style={bannerStyle}
                >
                    {props.entry.text && (
                        <div
                            className={styles.structuredMarkdown}
                            // eslint-disable-next-line react/no-danger
                            dangerouslySetInnerHTML={{ __html: toSafeHtml(props.entry.text) }}
                        />
                    )}
                </section>
            )
        }

        case 'image': {

            const fallbackSource = props.entry.sourceUrl || props.entry.sourceMobileUrl
            if (!fallbackSource) {
                return <></>
            }

            return (
                <picture className={styles.structuredPicture}>
                    {props.entry.sourceMobileUrl && (
                        <source media='(max-width: 768px)' srcSet={props.entry.sourceMobileUrl} />
                    )}
                    <img
                        alt={props.entry.alt || 'Thrive content image'}
                        className={styles.structuredImage}
                        loading='lazy'
                        src={fallbackSource}
                    />
                </picture>
            )
        }

        default:

            return <></>
    }
}

/**
 * Thrive article detail page.
 *
 * @returns Thrive article content by route slug.
 */
// eslint-disable-next-line complexity
const ThriveArticlePage: FC = () => {
    const { articleTitle }: { articleTitle?: string } = useParams<{ articleTitle: string }>()
    const {
        article,
        isLoading,
    }: UseThriveArticleResult = useThriveArticle(articleTitle)

    const communityPath = rootRoute || '/'
    const thrivePath = buildThrivePath(thriveListingRouteId)
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

    const articleBodyHtml = useMemo<string>(() => toSafeHtml(article?.body ?? ''), [article?.body])

    const creationDateLabel = useMemo<string>(() => {
        if (!article?.creationDate) {
            return ''
        }

        const value = moment(article.creationDate)

        return value.isValid()
            ? value.format('MMMM D, YYYY')
            : ''
    }, [article?.creationDate])

    const groupedCategories = useMemo<Record<string, ContentCategory[]>>(() => {
        if (!article?.contentCategory.length) {
            return {}
        }

        return article.contentCategory.reduce((accumulator, category) => {
            const key = category.trackParent || 'General'

            if (!accumulator[key]) {
                accumulator[key] = []
            }

            accumulator[key].push(category)

            return accumulator
        }, {} as Record<string, ContentCategory[]>)
    }, [article?.contentCategory])

    const shareUrl = useMemo<string>(() => {
        if (typeof window === 'undefined') {
            return ''
        }

        return encodeURIComponent(window.location.href)
    }, [])

    const videoEmbedUrl = useMemo<string>(() => {
        if (!article?.contentUrl || article.type !== 'Video') {
            return ''
        }

        return getYouTubeEmbedUrl(article.contentUrl)
    }, [article?.contentUrl, article?.type])

    const shouldRedirectToExternalArticle = Boolean(
        article?.externalArticle
        && article.contentUrl,
    )

    const handleArticleContentClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
        if (!article || article.openExternalLinksInNewTab === false || typeof window === 'undefined') {
            return
        }

        const target = event.target as HTMLElement | null
        const anchor = target?.closest('a') as HTMLAnchorElement | null

        if (!anchor?.href) {
            return
        }

        try {
            const targetUrl = new URL(anchor.href, window.location.href)
            if (targetUrl.host.includes('topcoder')) {
                return
            }

            window.open(targetUrl.toString(), '_blank', 'noopener,noreferrer')
            event.preventDefault()
        } catch {
            // Ignore malformed hrefs from article content.
        }
    }, [article])

    useEffect(() => {
        if (article?.title && typeof document !== 'undefined') {
            document.title = article.title
        }
    }, [article?.title])

    useEffect(() => {
        if (!article?.externalArticle || !article.contentUrl || typeof window === 'undefined') {
            return
        }

        window.location.replace(article.contentUrl)
    }, [article?.contentUrl, article?.externalArticle])

    if (isLoading || shouldRedirectToExternalArticle) {
        return (
            <div className={styles.wrapper}>
                <Breadcrumb
                    items={breadcrumbs}
                    renderInline
                />
                <div className={styles.loading}>
                    <LoadingSpinner />
                </div>
            </div>
        )
    }

    if (!article) {
        return (
            <section className={styles.wrapper}>
                <Breadcrumb
                    items={breadcrumbs}
                    renderInline
                />
                <p className={styles.notFound}>Article not found</p>
            </section>
        )
    }

    const bannerImage = article.featuredImage || DEFAULT_BANNER_IMAGE
    const sidebarAuthorFallback = article.contentAuthor || 'Topcoder Thrive'

    return (
        <section className={styles.wrapper}>
            <Breadcrumb
                items={breadcrumbs}
                renderInline
            />

            <div className={article.featuredImage ? styles.bannerContainer : styles.bannerContainerDefaultImage}>
                <div className={styles.bannerInner}>
                    <div className={styles.bannerInnerLeft}>
                        <h4 className={styles.articleDate}>{creationDateLabel}</h4>
                        <h1 className={styles.articleTitle}>{article.title}</h1>
                    </div>

                    <div className={styles.bannerInnerRight}>
                        <div className={styles.siteHeaderBackground}>
                            <svg className={styles.bannerSvg}>
                                <clipPath id='thrive-banner-clip-path' clipPathUnits='objectBoundingBox'>
                                    <path d={THRIVE_BANNER_CLIP_PATH} />
                                </clipPath>
                            </svg>
                            <div
                                className={styles.bannerClippedImageHolder}
                                style={{ backgroundImage: `url(${bannerImage})` }}
                            />
                        </div>
                    </div>
                </div>

                <img
                    alt='Thrive banner shape'
                    className={styles.bannerBottomShape}
                    src={THRIVE_BANNER_BOTTOM_SHAPE}
                />
            </div>

            <div className={article.featuredImage ? styles.contentContainerWithBanner : styles.contentContainer}>
                <aside className={styles.contentLeftBar}>
                    <div className={styles.authorContainer}>
                        {article.contentAuthors.length > 0 && article.contentAuthors.map(author => (
                            <div className={styles.authorWrapper} key={author.id}>
                                {author.avatarUrl && (
                                    <img
                                        alt={`${author.name} avatar`}
                                        className={styles.avatar}
                                        src={author.avatarUrl}
                                    />
                                )}
                                <div className={styles.authorInfos}>
                                    <span className={styles.name}>{author.name}</span>
                                    {author.tcHandle && (
                                        <span className={styles.handle}>{author.tcHandle}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {!article.contentAuthors.length && (
                            <div className={styles.authorWrapper}>
                                <div className={styles.authorInfos}>
                                    <span className={styles.name}>{sidebarAuthorFallback}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.separator} />
                    <h3 className={styles.label}>Duration</h3>
                    <span className={styles.duration}>{article.readTime || '-'}</span>

                    <div className={styles.separator} />
                    <h3 className={styles.label}>Categories</h3>
                    <div className={styles.catsWrapper}>
                        {Object.entries(groupedCategories)
                            .map(([trackParent, categories]) => (
                                <div className={styles.catsContainer} key={trackParent}>
                                    <Link
                                        className={styles.catItem}
                                        to={buildThrivePath(thriveTracksRouteId, { track: trackParent })}
                                    >
                                        {trackParent}
                                    </Link>
                                    {categories.map(category => (
                                        <Link
                                            className={styles.catItem}
                                            key={category.id}
                                            to={buildThrivePath(thriveTracksRouteId, {
                                                tax: category.name,
                                                track: category.trackParent || trackParent,
                                            })}
                                        >
                                            {category.name}
                                        </Link>
                                    ))}
                                </div>
                            ))}
                        {!Object.keys(groupedCategories).length && (
                            <span className={styles.duration}>-</span>
                        )}
                    </div>

                    <div className={styles.separator} />
                    <h3 className={styles.label}>Tags</h3>
                    <div className={styles.tagContainer}>
                        {article.tags.map(tag => (
                            <Link
                                className={styles.tagItem}
                                key={tag}
                                to={buildThrivePath(thriveSearchRouteId, { tags: tag })}
                            >
                                {tag}
                            </Link>
                        ))}
                        {!article.tags.length && (
                            <span className={styles.duration}>-</span>
                        )}
                    </div>

                    <div className={styles.separator} />
                    <h3 className={styles.label}>Share</h3>
                    <div className={styles.shareButtons}>
                        <a
                            className={styles.shareButton}
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                            rel='noopener noreferrer'
                            target='_blank'
                        >
                            LinkedIn
                        </a>
                        <a
                            className={styles.shareButton}
                            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&src=share_button`}
                            rel='noopener noreferrer'
                            target='_blank'
                        >
                            Facebook
                        </a>
                        <a
                            className={styles.shareButton}
                            href={`https://twitter.com/intent/tweet?url=${shareUrl}`}
                            rel='noopener noreferrer'
                            target='_blank'
                        >
                            Twitter
                        </a>
                    </div>

                    <div className={styles.separator} />
                    {article.leftSidebarContent ? (
                        <div className={styles.structuredSidebarContent}>
                            <StructuredEntryRenderer entry={article.leftSidebarContent} />
                        </div>
                    ) : (
                        <div className={styles.sidebarAd}>
                            <p className={styles.sidebarAdTitle}>Topcoder Thrive</p>
                            <p className={styles.sidebarAdText}>
                                Discover more stories from the community.
                            </p>
                            <Link className={styles.sidebarAdLink} to={buildThrivePath(thriveListingRouteId)}>
                                Browse articles
                            </Link>
                        </div>
                    )}
                </aside>

                <div className={styles.articleContent} onClick={handleArticleContentClick}>
                    {article.bodyContent && (
                        <div className={styles.structuredBodyContent}>
                            <StructuredEntryRenderer entry={article.bodyContent} />
                        </div>
                    )}

                    {articleBodyHtml && (
                        <div
                            className={styles.articleBody}
                            // eslint-disable-next-line react/no-danger
                            dangerouslySetInnerHTML={{ __html: articleBodyHtml }}
                        />
                    )}

                    {videoEmbedUrl && (
                        <div className={styles.videoContainer}>
                            <iframe
                                allow={VIDEO_IFRAME_ALLOW}
                                allowFullScreen
                                className={styles.videoFrame}
                                referrerPolicy='strict-origin-when-cross-origin'
                                src={videoEmbedUrl}
                                title={article.title}
                            />
                        </div>
                    )}

                    <div className={styles.actionContainer}>
                        <div className={styles.action}>
                            <div className={styles.circleGreenIcon}>+</div>
                            <span>{article.upvotes}</span>
                        </div>
                        <div className={styles.action}>
                            <div className={styles.circleRedIcon}>-</div>
                            <span>0</span>
                        </div>
                    </div>

                    <div className={styles.actionContainer}>
                        <a
                            className={styles.discordButton}
                            href='https://discord.gg/topcoder?ref=thrive-article'
                            rel='noopener noreferrer'
                            target='_blank'
                        >
                            Chat on Discord
                        </a>
                    </div>
                </div>
            </div>

            {article.recommended.length > 0 && (
                <section className={styles.recommendedContainer}>
                    <div className={styles.recommendedTopShape} />
                    <h3 className={styles.recommendedTitle}>Recommended for you</h3>
                    <div className={styles.recommended}>
                        {article.recommended.slice(0, 3)
                            .map(recommendedArticle => {
                                const isExternal
                                = recommendedArticle.externalArticle
                                    && !!recommendedArticle.contentUrl
                                const recommendedPath = buildArticlePath(
                                    recommendedArticle.slug
                                    || recommendedArticle.title
                                    || recommendedArticle.id,
                                )
                                const recommendedImage
                                = recommendedArticle.featuredImage || DEFAULT_BANNER_IMAGE

                                return (
                                    <article
                                        className={styles.recommendedCard}
                                        key={recommendedArticle.id}
                                    >
                                        <div
                                            className={styles.recommendedImage}
                                            style={{
                                                backgroundImage: `url(${recommendedImage})`,
                                            }}
                                        />

                                        <h4 className={styles.recommendedCardTitle}>
                                            {isExternal ? (
                                                <a
                                                    href={recommendedArticle.contentUrl}
                                                    rel='noopener noreferrer'
                                                    target='_blank'
                                                >
                                                    {recommendedArticle.title}
                                                </a>
                                            ) : (
                                                <Link to={recommendedPath}>
                                                    {recommendedArticle.title}
                                                </Link>
                                            )}
                                        </h4>

                                        <p className={styles.recommendedCardContent}>
                                            Explore this article on Topcoder Thrive.
                                        </p>

                                        {isExternal ? (
                                            <a
                                                className={styles.readMore}
                                                href={recommendedArticle.contentUrl}
                                                rel='noopener noreferrer'
                                                target='_blank'
                                            >
                                                Read More
                                            </a>
                                        ) : (
                                            <Link className={styles.readMore} to={recommendedPath}>
                                                Read More
                                            </Link>
                                        )}
                                    </article>
                                )
                            })}
                    </div>
                </section>
            )}
        </section>
    )
}

export default ThriveArticlePage
