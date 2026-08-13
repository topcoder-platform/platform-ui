/* eslint-disable react/jsx-no-bind */

import type { FC } from 'react'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet'
import { useLocation, useSearchParams } from 'react-router-dom'

import { useCmsCollection } from '~/libs/cms'

import { ThriveFilterPanel, ThriveResults, ThriveSearchBar } from '../../components'
import type { ThriveCategoryFields, ThriveFilters } from '../../models'
import { parseThriveFilters } from '../../utils'
import styles from '../../Thrive.module.scss'

/**
 * Renders route-driven search across Payload-backed Thrive articles, videos, and forum posts.
 *
 * @returns the Thrive search bar, advanced filters, and lazy active result tab.
 * @throws Does not throw; CMS failures render inline.
 */
export const ThriveSearchPage: FC = () => {
    const location = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()
    const filters = useMemo(() => parseThriveFilters(location.search), [location.search])
    const taxonomyQuery = useMemo(() => ({
        content_type: 'contentCategory',
        include: 1,
        limit: 1000,
        order: 'fields.name',
    }), [])
    const taxonomy = useCmsCollection<ThriveCategoryFields>('edu', taxonomyQuery)

    /**
     * Merges advanced search filters into the browser URL.
     *
     * @param updates selected search filters to replace in the route.
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
            <Helmet><title>Search Thrive | Topcoder</title></Helmet>
            <section className={styles.searchHero}>
                <ThriveSearchBar
                    initialMode={filters.title ? 'title' : 'phrase'}
                    initialValue={filters.title || filters.phrase}
                />
            </section>
            <div className={styles.whiteWave} />
            <div className={styles.resultsLayout}>
                <aside><ThriveFilterPanel filters={filters} onApply={updateFilters} showTrack /></aside>
                <section className={styles.resultsMain}>
                    <h1>Search Results</h1>
                    {taxonomy.loading && <div className={styles.loading}>Loading Thrive taxonomy…</div>}
                    {taxonomy.error && <div className={styles.error}>{taxonomy.error.message}</div>}
                    {taxonomy.data && <ThriveResults categories={taxonomy.data.items} filters={filters} />}
                </section>
            </div>
        </main>
    )
}
