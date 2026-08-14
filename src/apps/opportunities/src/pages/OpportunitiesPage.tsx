/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */
import classNames from 'classnames'
import {
    ChangeEvent,
    FC,
    useContext,
    useDeferredValue,
    useMemo,
    useState,
} from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR, { SWRResponse } from 'swr'

import {
    ProfileContextData,
    useProfileContext,
} from '~/libs/core'
import { IconOutline } from '~/libs/ui'

import {
    OpportunityFiltersPanel,
    OpportunityHero,
    OpportunityListCard,
    OpportunityPagination,
    OpportunityViewToggle,
} from '../components'
import {
    OpportunityFilters,
    OpportunityItem,
    OpportunityKind,
    OpportunityPage,
    OpportunitySummary,
    OpportunityView,
} from '../models'
import {
    getOpportunityPage,
    getOpportunitySummary,
} from '../services'
import { opportunityViewContext, OpportunityViewContextData } from '../opportunities.context'
import { parseSkillsFilter } from '../utils'

import styles from './OpportunitiesPage.module.scss'

const KIND_LABELS: Record<OpportunityKind, string> = {
    competitions: 'Competitions',
    copilots: 'Copilot Opportunities',
    engagements: 'Engagements',
    reviews: 'Review Opportunities',
}

const VALID_KINDS = new Set<OpportunityKind>([
    'competitions',
    'engagements',
    'copilots',
    'reviews',
])

const COMPETITION_REFRESH_INTERVAL_MS = 60 * 1000

/**
 * Resolves an optional route segment to a supported opportunity domain.
 *
 * @param value route parameter.
 * @returns matching domain, defaulting to competitions for the root route.
 * @throws Does not throw.
 */
export function resolveOpportunityKind(value?: string): OpportunityKind {
    return VALID_KINDS.has(value as OpportunityKind) ? value as OpportunityKind : 'competitions'
}

/**
 * Checks a Topcoder profile role without depending on capitalization.
 *
 * @param roles token role names.
 * @param expected role being checked.
 * @returns true when the role exists.
 * @throws Does not throw.
 */
function hasRole(roles: string[] | undefined, expected: string): boolean {
    return !!roles?.some(role => role.toLowerCase() === expected.toLowerCase())
}

/**
 * Builds the first-page status appropriate for each owning API.
 *
 * @param kind active opportunity domain.
 * @returns default status filter.
 * @throws Does not throw.
 */
function defaultStatus(kind: OpportunityKind): string {
    if (kind === 'competitions') return 'ACTIVE'
    if (kind === 'copilots') return 'active'
    return 'OPEN'
}

/**
 * Returns the semantic sort that accurately describes each domain's API.
 * Review opportunities do not expose a creation-date sort, so they begin with
 * the soonest review period instead of claiming to show the newest records.
 *
 * @param kind active opportunity domain.
 * @returns semantic sort choice consumed by the owning API adapter.
 * @throws Does not throw.
 */
export function defaultSort(kind: OpportunityKind): string {
    return kind === 'reviews' ? 'startingSoon' : 'newest'
}

interface LearningCardProps {
    body: string
    href: string
    title: string
}

/**
 * Renders the role-learning callout required for members who do not yet have a
 * reviewer or copilot role.
 *
 * @param props title, explanatory text, and Thrive destination.
 * @returns role education callout.
 * @throws Does not throw.
 */
const LearningCard: FC<LearningCardProps> = props => (
    <aside className={styles.learning}>
        <h3>{props.title}</h3>
        <p>{props.body}</p>
        <Link to={props.href}>
            Learn more
            <IconOutline.ArrowRightIcon />
        </Link>
    </aside>
)

interface ResultsLoadingProps {
    view: OpportunityView
}

/**
 * Renders stable card-shaped placeholders during the first page request.
 *
 * @param props active list or grid presentation.
 * @returns animated result placeholders matching the active presentation.
 * @throws Does not throw.
 */
const ResultsLoading: FC<ResultsLoadingProps> = props => (
    <div
        aria-label='Loading opportunities'
        className={classNames(styles.loading, { [styles.grid]: props.view === 'grid' })}
        role='status'
    >
        {[1, 2, 3, 4].map(value => <span key={value} />)}
    </div>
)

interface OpportunityListingProps {
    kind: OpportunityKind
    onViewChange: (view: OpportunityView) => void
    view: OpportunityView
}

/**
 * Renders the unified Opportunities listing while keeping each tab's data call
 * lazy, filtered, and paginated through its owning v6 API.
 *
 * @param props active route domain and shared member-selected display mode.
 * @returns the four-cell hero, server-backed filters, and one active result page.
 * @throws Does not throw; request failures render a retryable in-page state.
 */
const OpportunityListing: FC<OpportunityListingProps> = (props: OpportunityListingProps) => {
    const kind = props.kind
    const { profile }: ProfileContextData = useProfileContext()
    const [search, setSearch] = useState('')
    const deferredSearch = useDeferredValue(search.trim())
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [applied, setApplied] = useState(false)
    const [skills, setSkills] = useState('')
    const [tracks, setTracks] = useState<string[]>([])
    const [types, setTypes] = useState<string[]>([])
    const [status, setStatus] = useState(defaultStatus(kind))
    const [sort, setSort] = useState(defaultSort(kind))

    const filters = useMemo<OpportunityFilters>(() => ({
        applied,
        memberId: profile?.userId === undefined ? undefined : String(profile.userId),
        page,
        perPage,
        search: deferredSearch || undefined,
        skills: kind !== 'competitions' && skills.trim() ? parseSkillsFilter(skills) : undefined,
        sort,
        statuses: status ? [status] : undefined,
        tracks: tracks.length ? tracks : undefined,
        types: types.length ? types : undefined,
    }), [applied, deferredSearch, kind, page, perPage, profile?.userId, skills, sort, status, tracks, types])

    const summaryResponse: SWRResponse<OpportunitySummary, Error> = useSWR(
        'opportunities:summary',
        getOpportunitySummary,
        { revalidateOnFocus: false },
    )
    const pageResponse: SWRResponse<OpportunityPage<OpportunityItem>, Error> = useSWR(
        ['opportunities:list', kind, filters],
        () => getOpportunityPage(kind, filters),
        {
            refreshInterval: kind === 'competitions' ? COMPETITION_REFRESH_INTERVAL_MS : 0,
            revalidateOnFocus: kind === 'competitions',
        },
    )
    const data = pageResponse.data
    const isReviewer = hasRole(profile?.roles, 'reviewer')
    const isCopilot = hasRole(profile?.roles, 'copilot')

    /** Resets active controls and their server page. */
    const resetFilters = (): void => {
        setSearch('')
        setApplied(false)
        setSkills('')
        setTracks([])
        setTypes([])
        setStatus(defaultStatus(kind))
        setSort(defaultSort(kind))
        setPage(1)
    }

    /** Updates a track facet and starts again at page one. */
    const updateTrack = (track: string, checked: boolean): void => {
        setTracks(current => (checked
            ? Array.from(new Set([...current, track]))
            : current.filter(value => value !== track)))
        setPage(1)
    }

    /** Updates an opportunity-type facet and starts again at page one. */
    const updateType = (type: string, checked: boolean): void => {
        setTypes(current => (checked
            ? Array.from(new Set([...current, type]))
            : current.filter(value => value !== type)))
        setPage(1)
    }

    /** Updates the active status and starts again at page one. */
    const updateStatus = (value: string): void => {
        setStatus(value)
        setPage(1)
    }

    /** Updates the ownership filter and starts again at page one. */
    const updateApplied = (checked: boolean): void => {
        setApplied(checked)
        setPage(1)
    }

    /** Updates the search input and starts again at page one. */
    const updateSearch = (value: string): void => {
        setSearch(value)
        setPage(1)
    }

    /** Updates owner-specific comma-separated skill facets and starts at page one. */
    const updateSkills = (value: string): void => {
        setSkills(value)
        setPage(1)
    }

    /** Updates the page size and starts again at page one. */
    const updatePerPage = (value: number): void => {
        setPerPage(value)
        setPage(1)
    }

    /** Applies list sorting selected in the toolbar. */
    const updateSort = (event: ChangeEvent<HTMLSelectElement>): void => {
        setSort(event.target.value)
        setPage(1)
    }

    return (
        <main className={styles.page}>
            <OpportunityHero
                active={kind}
                error={!!summaryResponse.error}
                loading={summaryResponse.isValidating && !summaryResponse.data}
                onRetry={() => summaryResponse.mutate()}
                summary={summaryResponse.data}
            />
            <section className={styles.content}>
                <div className={styles.titleRow}>
                    <h2>{`Browse ${KIND_LABELS[kind]}`}</h2>
                    <div className={styles.toolbar}>
                        <label className={styles.sort}>
                            <IconOutline.SortDescendingIcon />
                            <strong>Sort by</strong>
                            <select aria-label='Sort opportunities' onChange={updateSort} value={sort}>
                                {kind !== 'reviews' && <option value='newest'>Newest first</option>}
                                <option value='startingSoon'>Starting soon</option>
                                {kind === 'reviews' && <option value='highestPayment'>Highest payment</option>}
                            </select>
                        </label>
                        <OpportunityViewToggle onChange={props.onViewChange} value={props.view} />
                    </div>
                </div>
                <div className={styles.body}>
                    <div className={styles.sidebar}>
                        <OpportunityFiltersPanel
                            applied={applied}
                            isAuthenticated={!!profile}
                            kind={kind}
                            onAppliedChange={updateApplied}
                            onReset={resetFilters}
                            onSearchChange={updateSearch}
                            onSkillsChange={updateSkills}
                            onStatusChange={updateStatus}
                            onTrackChange={updateTrack}
                            onTypeChange={updateType}
                            search={search}
                            skills={skills}
                            status={status}
                            tracks={tracks}
                            types={types}
                        />
                        {kind === 'reviews' && !isReviewer && (
                            <LearningCard
                                body='Interested in evaluating submissions on Topcoder?'
                                href='/thrive/articles/How%20to%20become%20a%20reviewer'
                                title='How to become a reviewer?'
                            />
                        )}
                        {kind === 'copilots' && !isCopilot && (
                            <LearningCard
                                body='Interested in managing challenges on Topcoder?'
                                href='/thrive/articles/How%20to%20become%20a%20copilot'
                                title='How to become a copilot?'
                            />
                        )}
                    </div>
                    <div className={styles.results} aria-live='polite'>
                        <OpportunityPagination
                            onPageChange={setPage}
                            onPerPageChange={updatePerPage}
                            page={data?.page ?? page}
                            perPage={data?.perPage ?? perPage}
                            total={data?.total ?? 0}
                            totalPages={data?.totalPages ?? 0}
                        />
                        {pageResponse.isValidating && !data && <ResultsLoading view={props.view} />}
                        {pageResponse.error && (
                            <div className={styles.message} role='alert'>
                                <IconOutline.ExclamationCircleIcon />
                                <h3>We couldn&apos;t load these opportunities.</h3>
                                <p>Please try again. Your filters have been preserved.</p>
                                <button onClick={() => pageResponse.mutate()} type='button'>Try again</button>
                            </div>
                        )}
                        {!pageResponse.error && data?.items.length === 0 && (
                            <div className={styles.message}>
                                <IconOutline.SearchIcon />
                                <h3>No matching opportunities</h3>
                                <p>Try removing a filter or changing your search.</p>
                            </div>
                        )}
                        <div className={classNames(styles.list, {
                            [styles.grid]: props.view === 'grid',
                        })}
                        >
                            {data?.items.map((item: OpportunityItem) => (
                                <OpportunityListCard
                                    item={item}
                                    key={item.id}
                                    kind={kind}
                                    registered={kind === 'competitions' && applied}
                                    view={props.view}
                                />
                            ))}
                        </div>
                        {(data?.items.length ?? 0) > 0 && (
                            <OpportunityPagination
                                onPageChange={setPage}
                                onPerPageChange={updatePerPage}
                                page={data?.page ?? page}
                                perPage={data?.perPage ?? perPage}
                                total={data?.total ?? 0}
                                totalPages={data?.totalPages ?? 0}
                            />
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}

/**
 * Resolves the route domain and keys the stateful listing by that value. The
 * key resets every filter before a request to a different owning API begins.
 *
 * @returns the active Opportunities category page.
 * @throws Does not throw; list request errors are handled by the child page.
 */
export const OpportunitiesPage: FC = () => {
    const params = useParams<{ kind?: string }>()
    const kind = resolveOpportunityKind(params.kind)
    const viewContext: OpportunityViewContextData = useContext(opportunityViewContext)
    return (
        <OpportunityListing
            key={kind}
            kind={kind}
            onViewChange={viewContext.onViewChange}
            view={viewContext.view}
        />
    )
}

export default OpportunitiesPage
