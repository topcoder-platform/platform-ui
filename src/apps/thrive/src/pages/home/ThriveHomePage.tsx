import type { FC } from 'react'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'

import type { CmsResource } from '~/libs/cms'
import { useCmsCollection } from '~/libs/cms'

import { ThriveArticleCard, ThriveSearchBar } from '../../components'
import { THRIVE_CARD_SELECT, THRIVE_ROOT_ROUTE, THRIVE_TRACKS } from '../../config'
import type { ThriveArticleFields, ThriveCategoryFields, ThriveTrack } from '../../models'
import { collectThriveArticles } from '../../utils'
import styles from '../../Thrive.module.scss'

interface TrackSectionProps {
    categories: Array<CmsResource<ThriveCategoryFields>>
    track: ThriveTrack
}

/**
 * Loads and renders the three newest Payload-hosted articles for one Thrive track.
 *
 * @param props visual track definition used for the query and legacy color treatment.
 * @returns a home-page track section with article cards.
 * @throws Does not throw; loading and empty states render in place.
 */
const TrackSection: FC<TrackSectionProps> = (props: TrackSectionProps) => {
    const query = useMemo(() => ({
        content_type: 'article',
        'fields.trackCategory': props.track.name,
        'fields.type': 'Article',
        include: 3,
        limit: 3,
        order: '-sys.createdAt',
        select: THRIVE_CARD_SELECT,
    }), [props.track.name])
    const articles = useCmsCollection<ThriveArticleFields>('edu', query)
    const route = `${THRIVE_ROOT_ROUTE}/tracks?track=${encodeURIComponent(props.track.name)}`

    return (
        <section className={styles.trackSection}>
            <header className={styles.trackHeader}>
                <span
                    aria-hidden='true'
                    className={styles.trackIcon}
                    style={{ backgroundColor: props.track.accent }}
                >
                    {props.track.icon}
                </span>
                <div>
                    <Link className={styles.trackTitleLink} to={route}>{props.track.name}</Link>
                    <div className={styles.trackCategories}>
                        {props.categories.map(category => (
                            <Link
                                key={category.sys.id}
                                to={`${route}&tax=${encodeURIComponent(category.fields.name)}`}
                            >
                                {category.fields.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </header>
            {articles.loading && <div className={styles.loading}>Loading articles…</div>}
            {articles.error && <div className={styles.error}>{articles.error.message}</div>}
            <div className={styles.homeCards}>
                {articles.data?.items.map(article => (
                    <ThriveArticleCard article={article} compact key={article.sys.id} />
                ))}
            </div>
            {!articles.loading && !articles.error && !articles.data?.items.length && (
                <div className={styles.empty}>No published articles in this track yet.</div>
            )}
        </section>
    )
}

/**
 * Renders the CMS-editable featured article group retained from the Thrive home viewport.
 *
 * @returns up to four resolved featured articles plus the article-submission call to action.
 * @throws Does not throw; unavailable viewport content is omitted.
 */
const HomeFeatured: FC = () => {
    const query = useMemo(() => ({
        include: 10,
        limit: 1,
        'sys.id': '4K24asXZxb5i48wXXaWjEC',
    }), [])
    const viewport = useCmsCollection<Record<string, unknown>>('edu', query)
    const articles = collectThriveArticles(viewport.data?.items[0])
        .slice(0, 4)

    return (
        <>
            {articles.length > 0 && (
                <section className={styles.featured}>
                    <div>
                        <h2>Featured Articles</h2>
                        <div className={styles.featuredCards}>
                            {articles.map(article => (
                                <ThriveArticleCard article={article} compact key={article.sys.id} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
            <section className={styles.thriveExtras}>
                <h2>Thrive Extras</h2>
                <Link to='/thrive/articles/Submitting%20a%20Thrive%20Article'>Learn how to submit</Link>
            </section>
        </>
    )
}

/**
 * Renders the Payload-backed Thrive landing page ported from community-app.
 *
 * @returns the Thrive hero, search, and seven article track sections.
 * @throws Does not throw.
 */
export const ThriveHomePage: FC = () => {
    const taxonomyQuery = useMemo(() => ({
        content_type: 'contentCategory',
        limit: 1000,
        order: 'fields.name',
    }), [])
    const taxonomy = useCmsCollection<ThriveCategoryFields>('edu', taxonomyQuery)

    return (
        <main className={styles.app}>
            <Helmet>
                <meta
                    content='Thrive is Topcoder’s vault of tutorials and workshops that matter.'
                    name='description'
                />
                <title>Tutorials And Workshops That Matter | Thrive | Topcoder</title>
            </Helmet>
            <section className={styles.homeHero}>
                <div className={styles.heroArt} aria-hidden='true'>T</div>
                <div className={styles.homeHeroContent}>
                    <h1>THRIVE</h1>
                    <p>Grow with us. Tutorials and workshops that matter.</p>
                    <ThriveSearchBar />
                    <small>
                        Don’t know what a challenge is?
                        {' '}
                        <Link to='/thrive/articles/all-about-topcoder-challenges-tasks-and-gig-work-opportunities'>
                            Find out here
                        </Link>
                        .
                    </small>
                </div>
            </section>
            <div className={styles.whiteWave} />
            <div className={styles.homeTracks}>
                {THRIVE_TRACKS.map(track => (
                    <TrackSection
                        categories={(taxonomy.data?.items || [])
                            .filter(category => category.fields.trackParent === track.name)}
                        key={track.name}
                        track={track}
                    />
                ))}
            </div>
            <HomeFeatured />
        </main>
    )
}
