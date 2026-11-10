/* eslint-disable react/jsx-no-bind */
import { FC, Fragment } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { PageTitle } from '~/libs/ui'

import { Gig } from '../models'
import { GigState } from '../components/GigShared'
import { GigHotlist, GigListingCard } from '../components/GigListingCard'
import { getGigs } from '../gigs.service'
import { filterGigs, gigFlag, GIGS_PER_PAGE, isOpenGig } from '../gigs.utils'

import styles from './GigsPage.module.scss'

/**
 * Lists open Recruit gigs with URL-persisted filters, consistent selected ordering
 * across the hotlist and results, featured priority, and ten-row pagination.
 */
const GigsPage: FC = () => {
    const [params, setParams] = useSearchParams()
    const {
        data: jobs,
        error,
        mutate,
    }: SWRResponse<Gig[]> = useSWR('gigs-list', getGigs, { shouldRetryOnError: false })
    const search = params.get('search') || ''
    const location = params.get('location') || ''
    const sort = params.get('sort') === 'updated_on' ? 'updated_on' : 'created_on'
    const filtered = filterGigs(jobs || [], search, location, sort)
    const pages = Math.max(1, Math.ceil(filtered.length / GIGS_PER_PAGE))
    const page = Math.min(pages, Math.max(1, Math.floor(Number(params.get('page')) || 1)))
    const locations = Array.from(
        new Set(
            (jobs || [])
                .filter(isOpenGig)
                .map(job => (job.country || '').trim())
                .filter(country => country && !['Any', 'Anywhere'].includes(country)),
        ),
    )
        .sort((a, b) => a.localeCompare(b))
    const hotlist = (jobs || [])
        .filter(job => isOpenGig(job) && gigFlag(job, 'Show in Hotlist'))
        .sort((a, b) => (Date.parse(b[sort] || '') || 0) - (Date.parse(a[sort] || '') || 0))
        .slice(0, 4)

    const visibleJobs = filtered.slice((page - 1) * GIGS_PER_PAGE, page * GIGS_PER_PAGE)
    const firstRegularJob = visibleJobs.findIndex(job => !gigFlag(job, 'Featured'))
    const hotlistIndex = Math.min(firstRegularJob < 0 ? visibleJobs.length : firstRegularJob, 2)
    const showHotlist = hotlist.length > 0 && page === 1 && !search && !location

    /** Updates one URL filter without dropping attribution parameters and resets the current result page. */
    function updateFilter(name: string, value: string): void {
        const next = new URLSearchParams(params)
        if (value) next.set(name, value)
        else next.delete(name)
        if (name !== 'page') next.delete('page')
        setParams(next, { replace: name === 'search' })
        if (name === 'page') window.scrollTo({ behavior: 'smooth', top: 0 })
    }

    return (
        <>
            <PageTitle>Find Freelance Work | Gigs | Topcoder</PageTitle>
            <header className='gigs-hero'>
                <div className='gigs-container'>
                    <nav className='gigs-nav' aria-label='Work opportunities'>
                        <Link to='/opportunities'>Opportunities</Link>
                        <span aria-current='page'>Gig Work</span>
                    </nav>
                    <p className='gigs-eyebrow'>Topcoder Gig Work</p>
                    <h1>Find your next gig</h1>
                    <p>
                        Put your skills to work. Explore freelance opportunities with leading companies around
                        the world.
                    </p>
                </div>
            </header>
            <main className={styles.listing}>
                <div className={styles.container}>
                    <section className={styles.filters} aria-label='Filter gigs'>
                        <div className={styles.search}>
                            <label className={styles.srOnly} htmlFor='gig-search'>
                                Search Gig Listings by Name or Skill
                            </label>
                            <input
                                className={styles.control}
                                id='gig-search'
                                type='search'
                                placeholder='Search Gig Listings by Name or Skill'
                                value={search}
                                onChange={event => updateFilter('search', event.target.value)}
                            />
                        </div>
                        <div className={styles.select}>
                            <label htmlFor='gig-location'>Location</label>
                            <select
                                className={styles.control}
                                id='gig-location'
                                value={location}
                                onChange={event => updateFilter('location', event.target.value)}
                            >
                                <option value=''>All</option>
                                {location && !locations.includes(location) && (
                                    <option value={location}>{location}</option>
                                )}
                                {locations.map(country => <option key={country}>{country}</option>)}
                            </select>
                        </div>
                        <div className={styles.select}>
                            <label htmlFor='gig-sort'>Sort by</label>
                            <select
                                className={styles.control}
                                id='gig-sort'
                                value={sort}
                                onChange={event => updateFilter('sort', event.target.value)}
                            >
                                <option value='created_on'>Latest Added Descending</option>
                                <option value='updated_on'>Latest Updated Descending</option>
                            </select>
                        </div>
                    </section>
                    {(search || location) && (
                        <button
                            className={styles.clear}
                            type='button'
                            onClick={() => {
                                const next = new URLSearchParams(params);
                                ['search', 'location', 'page'].forEach(key => next.delete(key))
                                setParams(next)
                            }}
                        >
                            Clear filters
                        </button>
                    )}
                    <section className={styles.results} aria-label='Gig listings'>
                        <p className={styles.srOnly} aria-live='polite'>
                            {jobs
                                ? `${filtered.length} ${filtered.length === 1 ? 'gig' : 'gigs'} available`
                                : 'Loading gig listings'}
                        </p>
                        {error ? (
                            <GigState title='Unable to load gigs' retry={() => { mutate() }} />
                        ) : !jobs ? (
                            <GigState title='Searching our database for the best gigs…' loading />
                        ) : (
                            <>
                                {visibleJobs.map((job, index) => (
                                    <Fragment key={job.slug}>
                                        {showHotlist && index === hotlistIndex && <GigHotlist jobs={hotlist} />}
                                        <GigListingCard job={job} />
                                    </Fragment>
                                ))}
                                {showHotlist && hotlistIndex === visibleJobs.length && <GigHotlist jobs={hotlist} />}
                                {!filtered.length && (
                                    <GigState title='No Results'>
                                        <p>
                                            Try a different search or location, or check back soon for new
                                            opportunities.
                                        </p>
                                    </GigState>
                                )}
                                {pages > 1 && (
                                    <nav className={styles.pagination} aria-label='Gig listing pages'>
                                        <button
                                            type='button'
                                            disabled={page === 1}
                                            onClick={() => updateFilter('page', String(page - 1))}
                                        >
                                            Previous
                                        </button>
                                        <span aria-live='polite'>{`Page ${page} of ${pages}`}</span>
                                        <button
                                            type='button'
                                            disabled={page === pages}
                                            onClick={() => updateFilter('page', String(page + 1))}
                                        >
                                            Next
                                        </button>
                                    </nav>
                                )}
                            </>
                        )}
                    </section>
                    <aside className='gigs-resources'>
                        <h2>Want to discover more about Gig Work on Topcoder?</h2>
                        <p>
                            Learn about the application process, read a quick guide for interviewing, and prepare
                            for your next opportunity.
                        </p>
                        <a
                            href={`${EnvironmentConfig.TOPCODER_URL}/lp/gig-resources`}
                            rel='noreferrer'
                            target='_blank'
                        >
                            Read our Gig Work resources
                        </a>
                    </aside>
                </div>
            </main>
        </>
    )
}

export default GigsPage
