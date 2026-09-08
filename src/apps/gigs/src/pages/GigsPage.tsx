/* eslint-disable react/jsx-no-bind */
import { FC } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { Button, PageTitle } from '~/libs/ui'

import { Gig } from '../models'
import { GigCard, GigState } from '../components/GigShared'
import { getGigs } from '../gigs.service'
import { filterGigs, gigFlag, GIGS_PER_PAGE, isOpenGig } from '../gigs.utils'

/** Lists open Recruit gigs with URL-persisted filters, featured ordering, hotlist, and ten-row pagination. */
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
        .sort((a, b) => (Date.parse(b.updated_on || '') || 0) - (Date.parse(a.updated_on || '') || 0))
        .slice(0, 4)

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
            <main className='gigs-container gigs-main'>
                <div className='gigs-list-layout'>
                    <aside className='gigs-filters' aria-label='Filter gigs'>
                        <h2>Find a gig</h2>
                        <label htmlFor='gig-search'>Search</label>
                        <input
                            className='gigs-filter-input'
                            id='gig-search'
                            type='search'
                            placeholder='Name, skills, location or duration'
                            value={search}
                            onChange={event => updateFilter('search', event.target.value)}
                        />
                        <label htmlFor='gig-location'>Location</label>
                        <select
                            id='gig-location'
                            value={location}
                            onChange={event => updateFilter('location', event.target.value)}
                        >
                            <option value=''>All locations</option>
                            {location && !locations.includes(location) && (
                                <option value={location}>{location}</option>
                            )}
                            {locations.map(country => (
                                <option key={country}>{country}</option>
                            ))}
                        </select>
                        {(search || location) && (
                            <Button
                                secondary
                                onClick={() => {
                                    const next = new URLSearchParams(params);
                                    ['search', 'location', 'page'].forEach(key => next.delete(key))
                                    setParams(next)
                                }}
                            >
                                Clear filters
                            </Button>
                        )}
                    </aside>
                    <section className='gigs-results' aria-label='Gig listings'>
                        <div className='gigs-toolbar'>
                            <h2 aria-live='polite'>
                                {jobs
                                    ? `${filtered.length} ${filtered.length === 1 ? 'gig' : 'gigs'} available`
                                    : 'Gig listings'}
                            </h2>
                            <label htmlFor='gig-sort'>
                                Sort by
                                <select
                                    id='gig-sort'
                                    value={sort}
                                    onChange={event => updateFilter('sort', event.target.value)}
                                >
                                    <option value='created_on'>Latest added</option>
                                    <option value='updated_on'>Latest updated</option>
                                </select>
                            </label>
                        </div>
                        {error ? (
                            <GigState
                                title='Unable to load gigs'
                                retry={() => {
                                    mutate()
                                }}
                            />
                        ) : !jobs ? (
                            <GigState title='Searching our database for the best gigs…' loading />
                        ) : (
                            <>
                                {hotlist.length > 0 && page === 1 && !search && !location && (
                                    <section className='gigs-hotlist' aria-label='Hotlist gigs'>
                                        <h2>On the hotlist</h2>
                                        <div>
                                            {hotlist.map(job => (
                                                <GigCard key={job.slug} job={job} compact />
                                            ))}
                                        </div>
                                    </section>
                                )}
                                {filtered.length ? (
                                    filtered
                                        .slice((page - 1) * GIGS_PER_PAGE, page * GIGS_PER_PAGE)
                                        .map(job => <GigCard key={job.slug} job={job} />)
                                ) : (
                                    <GigState title='No gigs found'>
                                        <p>
                                            Try a different search or location, or check back soon for new
                                            opportunities.
                                        </p>
                                    </GigState>
                                )}
                                {pages > 1 && (
                                    <nav className='gigs-pagination' aria-label='Gig listing pages'>
                                        <Button
                                            secondary
                                            disabled={page === 1}
                                            onClick={() => updateFilter('page', String(page - 1))}
                                        >
                                            Previous
                                        </Button>
                                        <span aria-live='polite'>{`Page ${page} of ${pages}`}</span>
                                        <Button
                                            secondary
                                            disabled={page === pages}
                                            onClick={() => updateFilter('page', String(page + 1))}
                                        >
                                            Next
                                        </Button>
                                    </nav>
                                )}
                            </>
                        )}
                    </section>
                </div>
                <aside className='gigs-resources'>
                    <h2>Want to discover more about Gig Work on Topcoder?</h2>
                    <p>
                        Learn about the application process, read a quick guide for interviewing, and prepare
                        for your next opportunity.
                    </p>
                    <a href={`${EnvironmentConfig.TOPCODER_URL}/community/gig-resources`}>
                        Read our Gig Work resources
                    </a>
                </aside>
            </main>
        </>
    )
}

export default GigsPage
