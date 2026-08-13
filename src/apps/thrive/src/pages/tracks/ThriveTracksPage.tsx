/* eslint-disable react/jsx-no-bind */

import type { FC } from 'react'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet'
import { useLocation, useSearchParams } from 'react-router-dom'

import { useCmsCollection } from '~/libs/cms'

import { ThriveFilterPanel, ThriveResults, ThriveSearchBar } from '../../components'
import { THRIVE_TRACKS } from '../../config'
import type { ThriveArticleFields, ThriveCategoryFields, ThriveContentType, ThriveFilters } from '../../models'
import { groupThriveCategories, parseThriveFilters } from '../../utils'
import styles from '../../Thrive.module.scss'

interface TrackCounterProps {
    label: string
    track: string
    type: ThriveContentType
}

/**
 * Loads only the total count for one content type in the selected Thrive track.
 *
 * @param props track/type filter and pluralized display label.
 * @returns one compact hero statistic.
 * @throws Does not throw; an unavailable count renders as an em dash.
 */
const TrackCounter: FC<TrackCounterProps> = (props: TrackCounterProps) => {
    const query = useMemo(() => ({
        content_type: 'article',
        'fields.trackCategory': props.track,
        'fields.type': props.type,
        limit: 0,
    }), [props.track, props.type])
    const result = useCmsCollection<ThriveArticleFields>('edu', query)

    return (
        <div>
            <strong>{result.data?.total ?? '—'}</strong>
            <span>{props.label}</span>
        </div>
    )
}

/**
 * Renders the track/category explorer and persists every selection in the route query string.
 *
 * @returns the Thrive track hero, taxonomy, filters, and active result tab.
 * @throws Does not throw; CMS failures render as page state.
 */
export const ThriveTracksPage: FC = () => {
    const location = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()
    const parsedFilters = useMemo(() => parseThriveFilters(location.search), [location.search])
    const selectedTrack = THRIVE_TRACKS.some(track => track.name === parsedFilters.track)
        ? parsedFilters.track as string
        : THRIVE_TRACKS[0].name
    const filters = useMemo<ThriveFilters>(() => ({
        author: parsedFilters.author,
        endDate: parsedFilters.endDate,
        phrase: parsedFilters.phrase,
        sortBy: parsedFilters.sortBy,
        startDate: parsedFilters.startDate,
        tags: parsedFilters.tags,
        tax: parsedFilters.tax,
        title: parsedFilters.title,
        track: selectedTrack,
    }), [parsedFilters, selectedTrack])
    const taxonomyQuery = useMemo(() => ({
        content_type: 'contentCategory',
        include: 1,
        limit: 1000,
        order: 'fields.name',
    }), [])
    const taxonomy = useCmsCollection<ThriveCategoryFields>('edu', taxonomyQuery)
    const grouped = useMemo(() => groupThriveCategories(taxonomy.data?.items || []), [taxonomy.data])
    const track = THRIVE_TRACKS.find(item => item.name === selectedTrack) || THRIVE_TRACKS[0]

    /**
     * Merges a filter change into the current URL without discarding search criteria.
     *
     * @param updates selected filter values to replace in the route.
     * @returns nothing after the router search state is updated.
     * @throws Does not throw.
     */
    const updateFilters = (updates: Partial<ThriveFilters>): void => {
        const next = new URLSearchParams(searchParams)
        Object.entries(updates)
            .forEach(([key, value]) => {
                next.delete(key)
                next.delete(`${key}[]`)
                if (Array.isArray(value)) {
                    value.forEach(item => next.append(key, item))
                } else if (value) {
                    next.set(key, String(value))
                }
            })
        setSearchParams(next)
    }

    return (
        <main className={styles.app}>
            <Helmet>
                <title>
                    {selectedTrack}
                    {' '}
                    tutorials | Thrive | Topcoder
                </title>
            </Helmet>
            <section className={styles.trackHero} style={{ backgroundColor: track.banner }}>
                <div className={styles.trackHeroArt} style={{ color: track.accent }}>{track.icon}</div>
                <div className={styles.trackHeroInner}>
                    <h1 className={selectedTrack === 'Topcoder' ? styles.lightText : undefined}>{selectedTrack}</h1>
                    <div className={selectedTrack === 'Topcoder'
                        ? `${styles.trackCounters} ${styles.lightText}`
                        : styles.trackCounters}
                    >
                        <TrackCounter label='articles' track={selectedTrack} type='Article' />
                        <TrackCounter label='videos' track={selectedTrack} type='Video' />
                        <TrackCounter label='forum posts' track={selectedTrack} type='Forum post' />
                    </div>
                    <ThriveSearchBar />
                </div>
            </section>
            <div className={styles.whiteWave} />
            <div className={styles.resultsLayout}>
                <aside className={styles.trackTree}>
                    <h2>Tracks</h2>
                    {THRIVE_TRACKS.map(item => (
                        <div key={item.name}>
                            <button
                                className={item.name === selectedTrack ? styles.selectedTrack : undefined}
                                onClick={() => updateFilters({ tax: [], track: item.name })}
                                type='button'
                            >
                                {item.name}
                            </button>
                            {item.name === selectedTrack && grouped[item.name]?.map(category => (
                                <button
                                    className={filters.tax?.includes(category.fields.name)
                                        ? styles.selectedCategory
                                        : undefined}
                                    key={category.sys.id}
                                    onClick={() => updateFilters({ tax: [category.fields.name] })}
                                    type='button'
                                >
                                    {category.fields.name}
                                </button>
                            ))}
                        </div>
                    ))}
                </aside>
                <section className={styles.resultsMain}>
                    <h2>{filters.tax?.[0] || selectedTrack}</h2>
                    <ThriveFilterPanel filters={filters} onApply={updateFilters} />
                    {taxonomy.loading && <div className={styles.loading}>Loading Thrive taxonomy…</div>}
                    {taxonomy.error && <div className={styles.error}>{taxonomy.error.message}</div>}
                    {taxonomy.data && <ThriveResults categories={taxonomy.data.items} filters={filters} />}
                </section>
            </div>
        </main>
    )
}
