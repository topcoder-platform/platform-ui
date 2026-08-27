/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */
import classNames from 'classnames'
import {
    ChangeEvent,
    FC,
    useDeferredValue,
    useMemo,
    useState,
} from 'react'
import useSWR, { SWRResponse } from 'swr'

import { authUrlLogin } from '~/libs/core'
import { IconOutline } from '~/libs/ui'

import {
    ChallengeCatalogValue,
    ChallengeOpportunity,
    CopilotOpportunity,
    EngagementOpportunity,
    OpportunityFilters,
    OpportunityItem,
    OpportunityKind,
    OpportunityPage,
    OpportunityView,
    OpportunityWorkStatus,
    ReviewOpportunity,
} from '../models'
import { getOpportunityPage } from '../services'
import {
    defaultSort,
    opportunitySortOptions,
} from '../utils/opportunity-listing.utils'

import { ReactComponent as ChevronDownIcon } from '../assets/chevron-down.svg'
import { ReactComponent as EmptyInfoIcon } from '../assets/empty-info.svg'
import { ReactComponent as ResetIcon } from '../assets/reset.svg'
import { ReactComponent as SortIcon } from '../assets/sort.svg'
import { MyWorkFiltersPanel } from './MyWorkFiltersPanel'
import { OpportunityListCard } from './OpportunityListCard'
import { OpportunityPagination } from './OpportunityPagination'
import { OpportunityViewToggle } from './OpportunityViewToggle'
import { challengeCatalogKey } from './challenge-card.utils'
import styles from './MyWorkListing.module.scss'

const WORK_KINDS: OpportunityKind[] = ['competitions', 'engagements', 'copilots', 'reviews']
const WORK_FETCH_SIZE = 100

interface MyWorkListingProps {
    kinds: OpportunityKind[]
    memberId?: string
    onKindsChange: (kinds: OpportunityKind[]) => void
    onViewChange: (view: OpportunityView) => void
    view: OpportunityView
}

export interface MyWorkItem {
    item: OpportunityItem
    kind: OpportunityKind
}

type MyWorkPages = Record<OpportunityKind, OpportunityPage<OpportunityItem>>

/**
 * Resolves the owning API status used by a My Work lifecycle selection.
 *
 * @param kind owning opportunity domain.
 * @param status authored all, active, or past lifecycle facet.
 * @returns owning API status array, or undefined for all work.
 * @throws Does not throw.
 */
export function myWorkStatuses(
    kind: OpportunityKind,
    status: OpportunityWorkStatus,
): string[] | undefined {
    if (status === 'all') return undefined
    if (status === 'active') {
        if (kind === 'competitions') return ['ACTIVE']
        if (kind === 'copilots') return ['active']
        return ['OPEN']
    }

    if (kind === 'competitions') return ['COMPLETED']
    if (kind === 'copilots') return ['completed']
    return ['CLOSED']
}

/**
 * Loads the member-scoped first hundred records from every owning API in
 * parallel so the client can render the authored mixed My Work list.
 *
 * @param memberId authenticated member identifier used by owning APIs.
 * @param search deferred unified search value.
 * @param status authored work lifecycle selection.
 * @param sort semantic sort selection.
 * @returns one normalized page for each opportunity domain.
 * @throws Propagates request, authorization, and owning-API errors.
 */
export async function getMyWorkPages(
    memberId: string,
    search: string,
    status: OpportunityWorkStatus,
    sort: string,
): Promise<MyWorkPages> {
    const entries = await Promise.all(WORK_KINDS.map(async kind => {
        const filters: OpportunityFilters = {
            applied: true,
            memberId,
            page: 1,
            perPage: WORK_FETCH_SIZE,
            search: search || undefined,
            sort,
            statuses: myWorkStatuses(kind, status),
        }
        const page = await getOpportunityPage(kind, filters) as OpportunityPage<OpportunityItem>
        return [kind, page] as const
    }))
    return Object.fromEntries(entries) as MyWorkPages
}

/**
 * Normalizes a catalog entry to its human-readable API value.
 *
 * @param value string or expanded Challenge API catalog object.
 * @returns catalog name, track code, or an empty string.
 * @throws Does not throw.
 */
function catalogValue(value?: ChallengeCatalogValue): string {
    if (typeof value === 'string') return value
    return value?.name ?? value?.track ?? ''
}

/**
 * Maps owner-specific track values to the five My Work facet tokens.
 *
 * @param result tagged opportunity from an owning API.
 * @returns matching design, development, data-science, qa, or ai token.
 * @throws Does not throw.
 */
export function myWorkTrack(result: MyWorkItem): string | undefined {
    let value = ''
    if (result.kind === 'competitions') {
        value = catalogValue((result.item as ChallengeOpportunity).track)
    } else if (result.kind === 'engagements') {
        value = (result.item as EngagementOpportunity).role ?? ''
    } else if (result.kind === 'copilots') {
        const item = result.item as CopilotOpportunity
        value = item.projectType ?? item.type ?? ''
    } else {
        const item = result.item as ReviewOpportunity
        value = String(item.challengeData?.track ?? item.challengeData?.trackName ?? '')
    }

    const key = challengeCatalogKey(value)
    if (key.includes('design')) return 'design'
    if (key.includes('development') || key.includes('developer') || key === 'dev') return 'development'
    if (key.includes('data')) return 'data-science'
    if (key.includes('quality') || key === 'qa') return 'qa'
    if (key.includes('artificial') || key === 'ai') return 'ai'
    return undefined
}

/**
 * Maps owner-specific subtype values to the five My Work type tokens.
 *
 * @param result tagged opportunity from an owning API.
 * @returns challenge, first2finish, marathon-match, gig, or task token.
 * @throws Does not throw.
 */
export function myWorkType(result: MyWorkItem): string | undefined {
    if (result.kind === 'engagements') return 'gig'
    let value = ''
    if (result.kind === 'competitions') {
        value = catalogValue((result.item as ChallengeOpportunity).type)
    } else if (result.kind === 'copilots') {
        value = (result.item as CopilotOpportunity).type ?? ''
    } else {
        const item = result.item as ReviewOpportunity
        value = String(item.challengeData?.type ?? item.type ?? '')
    }

    const key = challengeCatalogKey(value)
    if (key === 'challenge') return 'challenge'
    if (key === 'first2finish' || key === 'f2f') return 'first2finish'
    if (key === 'marathonmatch' || key === 'mm') return 'marathon-match'
    if (key === 'gig') return 'gig'
    if (key === 'task') return 'task'
    return undefined
}

/**
 * Resolves the member-facing application pill for a mixed My Work card.
 *
 * @param result tagged opportunity from an owning API.
 * @returns Registered for competitions, Accepted for approved work, otherwise Applied.
 * @throws Does not throw.
 */
export function myWorkState(result: MyWorkItem): string {
    if (result.kind === 'competitions') return 'Registered'
    let value: string | undefined
    if (result.kind === 'engagements') {
        const item = result.item as EngagementOpportunity
        value = item.applicationStatus ?? item.myApplication?.status
    } else if (result.kind === 'copilots') {
        value = (result.item as CopilotOpportunity).currentUserApplication?.status
    } else {
        value = (result.item as ReviewOpportunity).myApplications?.[0]?.status
    }

    const accepted = ['accepted', 'approved', 'selected']
        .includes(challengeCatalogKey(value))
    return accepted ? 'Accepted' : 'Applied'
}

/**
 * Returns the most useful date for cross-domain newest/starting-soon sorting.
 *
 * @param result tagged opportunity from an owning API.
 * @param startingSoon whether start dates should take priority.
 * @returns epoch milliseconds, placing absent dates at the end.
 * @throws Does not throw.
 */
function myWorkDate(result: MyWorkItem, startingSoon: boolean): number {
    const item = result.item as OpportunityItem & Record<string, any>
    const value = startingSoon
        ? item.startDate ?? item.durationStartDate ?? item.createdAt
        : item.updatedAt ?? item.createdAt ?? item.startDate
    const date = Date.parse(String(value ?? ''))
    return Number.isFinite(date) ? date : (startingSoon ? Number.POSITIVE_INFINITY : 0)
}

/**
 * Returns searchable owner fields for defensive local filtering of mixed pages.
 *
 * @param result tagged opportunity from an owning API.
 * @returns lowercase title, description, skill, track, and subtype text.
 * @throws Does not throw.
 */
function myWorkSearchText(result: MyWorkItem): string {
    const item = result.item as OpportunityItem & Record<string, any>
    const challenge = item.challengeData ?? {}
    const skills = (item.skills ?? []).map((skill: { name?: string }) => skill.name)
    return [
        item.name,
        item.title,
        item.opportunityTitle,
        item.projectName,
        item.challengeName,
        challenge.name,
        item.description,
        item.overview,
        catalogValue(item.track),
        catalogValue(item.type),
        ...skills,
    ].filter(Boolean)
        .join(' ')
        .toLowerCase()
}

/**
 * Toggles a controlled unique facet value without mutating the current array.
 *
 * @param current current selected values.
 * @param value value being toggled.
 * @param checked whether the value should be present.
 * @returns new stable-order selection.
 * @throws Does not throw.
 */
function toggleFacet<T>(current: T[], value: T, checked: boolean): T[] {
    return checked
        ? Array.from(new Set([...current, value]))
        : current.filter(item => item !== value)
}

/**
 * Renders the authenticated member's combined competition, engagement,
 * copilot, and review work with the authored filters and shared cards.
 *
 * @param props member identity, controlled domain facets, and view callbacks.
 * @returns mixed, filtered, sorted, and paginated My Work section.
 * @throws Does not throw; owning-API failures render a retryable in-page state.
 */
export const MyWorkListing: FC<MyWorkListingProps> = props => {
    const [search, setSearch] = useState('')
    const deferredSearch = useDeferredValue(search.trim())
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [status, setStatus] = useState<OpportunityWorkStatus>('all')
    const [tracks, setTracks] = useState<string[]>([])
    const [types, setTypes] = useState<string[]>([])
    const [sort, setSort] = useState(defaultSort())
    const response: SWRResponse<MyWorkPages, Error> = useSWR(
        props.memberId
            ? ['opportunities:my-work', props.memberId, deferredSearch, status, sort]
            : undefined,
        () => getMyWorkPages(props.memberId as string, deferredSearch, status, sort),
        { revalidateOnFocus: false },
    )

    const filtered = useMemo<MyWorkItem[]>(() => {
        const selectedKinds = props.kinds.length ? props.kinds : WORK_KINDS
        const query = deferredSearch.toLowerCase()
        const items = selectedKinds.flatMap(kind => (response.data?.[kind].items ?? [])
            .map(item => ({ item, kind })))
            .filter(result => !query || myWorkSearchText(result)
                .includes(query))
            .filter(result => !tracks.length || tracks.includes(myWorkTrack(result) ?? ''))
            .filter(result => !types.length || types.includes(myWorkType(result) ?? ''))
        const startingSoon = sort === 'startingSoon'
        return [...items].sort((first, second) => (startingSoon
            ? myWorkDate(first, true) - myWorkDate(second, true)
            : myWorkDate(second, false) - myWorkDate(first, false)))
    }, [deferredSearch, props.kinds, response.data, sort, tracks, types])

    const totalPages = filtered.length ? Math.ceil(filtered.length / perPage) : 0
    const visibleItems = filtered.slice((page - 1) * perPage, page * perPage)

    /**
     * Resets every mixed-list filter and returns to page one.
     *
     * @returns void.
     * @throws Does not throw.
     */
    const resetFilters = (): void => {
        setSearch('')
        setStatus('all')
        props.onKindsChange([])
        setTracks([])
        setTypes([])
        setSort(defaultSort())
        setPage(1)
    }

    /**
     * Updates the unified search and returns to page one.
     *
     * @param value new member search value.
     * @returns void.
     * @throws Does not throw.
     */
    const updateSearch = (value: string): void => {
        setSearch(value)
        setPage(1)
    }

    /**
     * Updates the lifecycle filter and returns to page one.
     *
     * @param value selected work lifecycle.
     * @returns void.
     * @throws Does not throw.
     */
    const updateStatus = (value: OpportunityWorkStatus): void => {
        setStatus(value)
        setPage(1)
    }

    /**
     * Updates one opportunity-domain filter and returns to page one.
     *
     * @param kind domain being toggled.
     * @param checked whether the domain should be selected.
     * @returns void.
     * @throws Does not throw.
     */
    const updateKind = (kind: OpportunityKind, checked: boolean): void => {
        props.onKindsChange(toggleFacet(props.kinds, kind, checked))
        setPage(1)
    }

    /**
     * Updates one track filter and returns to page one.
     *
     * @param track authored track token.
     * @param checked whether the track should be selected.
     * @returns void.
     * @throws Does not throw.
     */
    const updateTrack = (track: string, checked: boolean): void => {
        setTracks(current => toggleFacet(current, track, checked))
        setPage(1)
    }

    /**
     * Updates one subtype filter and returns to page one.
     *
     * @param type authored subtype token.
     * @param checked whether the subtype should be selected.
     * @returns void.
     * @throws Does not throw.
     */
    const updateType = (type: string, checked: boolean): void => {
        setTypes(current => toggleFacet(current, type, checked))
        setPage(1)
    }

    /**
     * Updates the page size and returns to page one.
     *
     * @param value selected result count.
     * @returns void.
     * @throws Does not throw.
     */
    const updatePerPage = (value: number): void => {
        setPerPage(value)
        setPage(1)
    }

    /**
     * Updates mixed-list sorting and returns to page one.
     *
     * @param event native sort select change event.
     * @returns void.
     * @throws Does not throw.
     */
    const updateSort = (event: ChangeEvent<HTMLSelectElement>): void => {
        setSort(event.target.value)
        setPage(1)
    }

    return (
        <section className={styles.content}>
            <div className={styles.titleRow}>
                <h2>My Work</h2>
                <div className={styles.toolbar}>
                    <label className={styles.sort}>
                        <SortIcon aria-hidden='true' />
                        <strong>Sort by</strong>
                        <span className={styles.sortSelect}>
                            <select aria-label='Sort my work' onChange={updateSort} value={sort}>
                                {opportunitySortOptions('competitions')
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
                {!props.memberId ? (
                    <div className={classNames(styles.message, styles.signInMessage)}>
                        <IconOutline.LockClosedIcon aria-hidden='true' />
                        <h3>Sign in to view your work</h3>
                        <p>See your registered competitions and accepted or pending opportunities in one place.</p>
                        <a href={authUrlLogin()}>Sign in</a>
                    </div>
                ) : (
                    <>
                        <MyWorkFiltersPanel
                            kinds={props.kinds}
                            onKindChange={updateKind}
                            onReset={resetFilters}
                            onSearchChange={updateSearch}
                            onStatusChange={updateStatus}
                            onTrackChange={updateTrack}
                            onTypeChange={updateType}
                            search={search}
                            status={status}
                            tracks={tracks}
                            types={types}
                        />
                        <div aria-live='polite' className={styles.results}>
                            <OpportunityPagination
                                onPageChange={setPage}
                                onPerPageChange={updatePerPage}
                                page={page}
                                perPage={perPage}
                                total={filtered.length}
                                totalPages={totalPages}
                            />
                            {response.isValidating && !response.data && (
                                <div
                                    aria-label='Loading my work'
                                    className={classNames(styles.loading, {
                                        [styles.grid]: props.view === 'grid',
                                    })}
                                    role='status'
                                >
                                    {[1, 2, 3, 4].map(value => <span key={value} />)}
                                </div>
                            )}
                            {response.error && (
                                <div className={styles.message} role='alert'>
                                    <IconOutline.ExclamationCircleIcon />
                                    <h3>We couldn&apos;t load your work.</h3>
                                    <p>Please try again. Your filters have been preserved.</p>
                                    <button onClick={() => response.mutate()} type='button'>Try again</button>
                                </div>
                            )}
                            {!response.error && response.data && visibleItems.length === 0 && (
                                <div className={styles.empty}>
                                    <span className={styles.emptyIcon}><EmptyInfoIcon aria-hidden='true' /></span>
                                    <h3>No results found</h3>
                                    <div className={styles.emptyCopy}>
                                        <p>There is no matching work right now.</p>
                                        <p>Adjust your filters or check back later.</p>
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
                                {visibleItems.map(result => (
                                    <OpportunityListCard
                                        applicationState={myWorkState(result)}
                                        item={result.item}
                                        key={`${result.kind}:${result.item.id}`}
                                        kind={result.kind}
                                        registered={result.kind === 'competitions'}
                                        view={props.view}
                                    />
                                ))}
                            </div>
                            {visibleItems.length > 0 && (
                                <OpportunityPagination
                                    onPageChange={setPage}
                                    onPerPageChange={updatePerPage}
                                    page={page}
                                    perPage={perPage}
                                    total={filtered.length}
                                    totalPages={totalPages}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
        </section>
    )
}
