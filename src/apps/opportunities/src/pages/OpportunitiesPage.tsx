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
import { useParams } from 'react-router-dom'
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
    getMemberChallengeRegistrationIds,
    getOpportunityPage,
    getOpportunitySummary,
} from '../services'
import {
    defaultSort,
    opportunitySortOptions,
} from '../utils/opportunity-listing.utils'
import { opportunityViewContext, OpportunityViewContextData } from '../opportunities.context'

import { ReactComponent as ChevronDownIcon } from '../assets/chevron-down.svg'
import { ReactComponent as EmptyInfoIcon } from '../assets/empty-info.svg'
import { ReactComponent as ResetIcon } from '../assets/reset.svg'
import { ReactComponent as SortIcon } from '../assets/sort.svg'
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

interface LearningCardProps {
    body: string
    href: string
    title: string
}

/**
 * Renders the role-learning callout shown beside reviewer listings and for
 * members who do not yet have a copilot role.
 *
 * @param props title, explanatory text, and Thrive destination.
 * @returns role education callout.
 * @throws Does not throw.
 */
const LearningCard: FC<LearningCardProps> = props => (
    <aside className={styles.learning}>
        <h3>{props.title}</h3>
        <p>{props.body}</p>
        <a href={props.href}>
            Learn more
            <IconOutline.ArrowRightIcon />
        </a>
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
    const [tracks, setTracks] = useState<string[]>([])
    const [types, setTypes] = useState<string[]>([])
    const [role, setRole] = useState('')
    const [status, setStatus] = useState(defaultStatus(kind))
    const [sort, setSort] = useState(defaultSort())

    const filters = useMemo<OpportunityFilters>(() => ({
        applied,
        memberId: profile?.userId === undefined ? undefined : String(profile.userId),
        page,
        perPage,
        role: role || undefined,
        search: deferredSearch || undefined,
        sort,
        statuses: status ? [status] : undefined,
        tracks: tracks.length ? tracks : undefined,
        types: types.length ? types : undefined,
    }), [applied, deferredSearch, page, perPage, profile?.userId, role, sort, status, tracks, types])

    const pageResponse: SWRResponse<OpportunityPage<OpportunityItem>, Error> = useSWR(
        ['opportunities:list', kind, filters],
        () => getOpportunityPage(kind, filters),
        {
            refreshInterval: kind === 'competitions' ? COMPETITION_REFRESH_INTERVAL_MS : 0,
            revalidateOnFocus: kind === 'competitions',
        },
    )
    const registrationIdsResponse: SWRResponse<string[], Error> = useSWR(
        kind === 'competitions' && filters.memberId
            ? ['opportunities:competition-registration-ids', filters.memberId]
            : undefined,
        () => getMemberChallengeRegistrationIds(filters.memberId as string),
        { revalidateOnFocus: false },
    )
    const data = pageResponse.data
    const registrationIds = useMemo(
        () => new Set(registrationIdsResponse.data ?? []),
        [registrationIdsResponse.data],
    )
    const isCopilot = hasRole(profile?.roles, 'copilot')

    /** Resets active controls and their server page. */
    const resetFilters = (): void => {
        setSearch('')
        setApplied(false)
        setTracks([])
        setTypes([])
        setRole('')
        setStatus(defaultStatus(kind))
        setSort(defaultSort())
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

    /**
     * Updates the single engagement-role facet and starts again at page one.
     *
     * @param value Engagement API role enum, or an empty string to clear it.
     * @returns void.
     * @throws Does not throw.
     */
    const updateRole = (value: string): void => {
        setRole(value)
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
        <section className={styles.content}>
            <div className={styles.titleRow}>
                <h2>{`Browse ${KIND_LABELS[kind]}`}</h2>
                <div className={styles.toolbar}>
                    <label className={styles.sort}>
                        <SortIcon aria-hidden='true' />
                        <strong>Sort by</strong>
                        <span className={styles.sortSelect}>
                            <select aria-label='Sort opportunities' onChange={updateSort} value={sort}>
                                {opportunitySortOptions(kind)
                                    .map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                            </select>
                            <ChevronDownIcon aria-hidden='true' />
                        </span>
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
                        onRoleChange={updateRole}
                        onSearchChange={updateSearch}
                        onStatusChange={updateStatus}
                        onTrackChange={updateTrack}
                        onTypeChange={updateType}
                        search={search}
                        selectedRole={role}
                        status={status}
                        tracks={tracks}
                        types={types}
                    />
                    {kind === 'reviews' && (
                        <LearningCard
                            body='Interested in evaluating submissions on Topcoder?'
                            href='/thrive/articles/How%20to%20become%20a%20reviewer'
                            title='How to become a reviewer?'
                        />
                    )}
                    {kind === 'copilots' && !isCopilot && (
                        <LearningCard
                            body='Interested in managing challenges on Topcoder?'
                            href='https://www.topcoder.com/thrive/articles/become-a-copilot-at-topcoder'
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
                        <div className={styles.empty}>
                            <span className={styles.emptyIcon}>
                                <EmptyInfoIcon aria-hidden='true' />
                            </span>
                            <h3>No results found</h3>
                            <div className={styles.emptyCopy}>
                                <p>There are no matching opportunities right now.</p>
                                <p>Check back later for new opportunities</p>
                            </div>
                            <button onClick={resetFilters} type='button'>
                                <ResetIcon aria-hidden='true' />
                                Reset filter
                            </button>
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
                                memberApplied={applied}
                                onSkillClick={updateSearch}
                                registered={kind === 'competitions'
                                    && (applied || registrationIds.has(item.id))}
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
    )
}

/**
 * Resolves the route domain and keys the stateful listing by its domain.
 * The listing key resets every filter before a request to a different owning
 * API begins.
 *
 * @returns the active Opportunities category page.
 * @throws Does not throw; list request errors are handled by the child page.
 */
export const OpportunitiesPage: FC = () => {
    const params = useParams<{ kind?: string }>()
    const kind = resolveOpportunityKind(params.kind)
    const viewContext: OpportunityViewContextData = useContext(opportunityViewContext)
    const summaryResponse: SWRResponse<OpportunitySummary, Error> = useSWR(
        'opportunities:summary',
        getOpportunitySummary,
        { revalidateOnFocus: false },
    )
    /**
     * Retries public header totals after a summary failure.
     *
     * @returns void after scheduling the available SWR revalidations.
     * @throws Does not throw; SWR retains and exposes request failures.
     */
    const retrySummaries = (): void => {
        summaryResponse.mutate()
            .catch(() => undefined)
    }

    return (
        <main className={styles.page}>
            <OpportunityHero
                active={kind}
                error={!!summaryResponse.error}
                loading={summaryResponse.isValidating && !summaryResponse.data}
                onRetry={retrySummaries}
                summary={summaryResponse.data}
            />
            <OpportunityListing
                key={kind}
                kind={kind}
                onViewChange={viewContext.onViewChange}
                view={viewContext.view}
            />
        </main>
    )
}

export default OpportunitiesPage
