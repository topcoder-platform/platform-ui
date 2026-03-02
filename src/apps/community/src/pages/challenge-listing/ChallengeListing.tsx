/* eslint-disable complexity */
import { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import classNames from 'classnames'

import { profileContext, ProfileContextData } from '~/libs/core'
import { EnvironmentConfig } from '~/config'
import {
    Breadcrumb,
    BreadcrumbItemModel,
    Button,
    LoadingSpinner,
    Table,
    TableColumn,
} from '~/libs/ui'

import { challengeListingRouteId, rootRoute } from '../../config/routes.config'
import {
    bucketToParams,
    BUCKET_LABELS,
    ChallengeBucket,
    ChallengeInfo,
    ChallengeListParams,
    SORT_OPTIONS,
    useChallenges,
    UseChallengesResult,
    useCommunityMeta,
    UseCommunityMetaResult,
} from '../../lib'

import {
    ChallengeFilters,
    SidebarBucket,
    SIDEBAR_BUCKET_LABELS,
} from './ChallengeFilters'
import ChallengeCard, { type PrizeMode } from './ChallengeCard/ChallengeCard'
import styles from './ChallengeListing.module.scss'

const DEFAULT_SORT = 'startDate'

const DEFAULT_TRACKS: Record<string, boolean> = {
    DataScience: true,
    Design: true,
    Development: true,
    QA: true,
}

const DEFAULT_TYPES: Record<string, boolean> = {
    Challenge: true,
    First2Finish: true,
    MarathonMatch: true,
    Task: true,
}

const TRACK_QUERY_VALUE: Record<string, string> = {
    DataScience: 'DS',
    Design: 'Des',
    Development: 'Dev',
    QA: 'QA',
}

const TYPE_QUERY_VALUE: Record<string, string> = {
    Challenge: 'CH',
    First2Finish: 'F2F',
    MarathonMatch: 'MM',
    Task: 'TSK',
}

function getSortParams(sortBy: string): Pick<ChallengeListParams, 'sortBy' | 'sortOrder'> {
    if (sortBy.endsWith('-high-to-low')) {
        return {
            sortBy: sortBy.replace('-high-to-low', ''),
            sortOrder: 'desc',
        }
    }

    if (sortBy.endsWith('-low-to-high')) {
        return {
            sortBy: sortBy.replace('-low-to-high', ''),
            sortOrder: 'asc',
        }
    }

    if (sortBy === 'name') {
        return {
            sortBy,
            sortOrder: 'asc',
        }
    }

    return {
        sortBy,
        sortOrder: 'desc',
    }
}

/**
 * Converts active sidebar bucket selection into challenge query params.
 *
 * @param bucket Active sidebar bucket.
 * @param memberId Current member id.
 * @returns API params for active tab bucket selection.
 */
function sidebarBucketToParams(
    bucket: SidebarBucket,
    memberId?: string,
): Partial<ChallengeListParams> {
    switch (bucket) {
        case SidebarBucket.All:
            return {}
        case SidebarBucket.MyChallenges:
            return {
                memberId,
            }
        case SidebarBucket.OpenForRegistration:
            return {
                currentPhaseName: 'Registration',
            }
        case SidebarBucket.OpenForReview:
            return {
                currentPhaseName: 'Review',
            }
        case SidebarBucket.CopilotOpportunities:
            return {
                tags: ['Copilot'],
            }
        default:
            return {}
    }
}

/**
 * Prepends a leading slash to a route when missing.
 *
 * @param route Route path.
 * @returns Route path with leading slash.
 */
function withLeadingSlash(route: string): string {
    return route.startsWith('/')
        ? route
        : `/${route}`
}

/**
 * Community challenge listing route component with tab navigation, sidebar filters and paginated rows.
 *
 * @returns Challenge listing page content.
 */
const ChallengeListing: FC = () => {
    const [searchParams] = useSearchParams()
    const { isLoggedIn, profile }: ProfileContextData = useContext(profileContext)
    const [activeTab, setActiveTab] = useState<ChallengeBucket>(
        ChallengeBucket.ActiveChallenges,
    )
    const [activeBucket, setActiveBucket] = useState<SidebarBucket>(
        SidebarBucket.OpenForRegistration,
    )
    const [search, setSearch] = useState<string>('')
    const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT)
    const [tracks, setTracks] = useState<Record<string, boolean>>(DEFAULT_TRACKS)
    const [types, setTypes] = useState<Record<string, boolean>>(DEFAULT_TYPES)
    const [page, setPage] = useState<number>(1)
    const [allChallenges, setAllChallenges] = useState<ChallengeInfo[]>([])

    const prizeMode: PrizeMode = searchParams.get('prizeMode') === 'points'
        ? 'points'
        : 'money-usd'
    const communityId = searchParams.get('communityId') ?? undefined
    const memberId = profile?.userId ? `${profile.userId}` : undefined
    const { communityMeta, isLoading: isLoadingCommunityMeta }: UseCommunityMetaResult
        = useCommunityMeta(communityId)

    const tabs = useMemo<ReadonlyArray<{ id: ChallengeBucket; title: string }>>(() => (
        Object.values(ChallengeBucket)
            .map(bucket => ({
                id: bucket,
                title: BUCKET_LABELS[bucket],
            }))
    ), [])

    const selectedTracks = useMemo<string[]>(
        () => Object.entries(TRACK_QUERY_VALUE)
            .filter(([key]) => tracks[key])
            .map(([, value]) => value),
        [tracks],
    )
    const selectedTypes = useMemo<string[]>(
        () => Object.entries(TYPE_QUERY_VALUE)
            .filter(([key]) => types[key])
            .map(([, value]) => value),
        [types],
    )

    const tabParams = useMemo(
        () => bucketToParams(activeTab, memberId),
        [activeTab, memberId],
    )
    const sidebarParams = useMemo(
        () => (
            activeTab === ChallengeBucket.ActiveChallenges
                ? sidebarBucketToParams(activeBucket, memberId)
                : {}
        ),
        [activeBucket, activeTab, memberId],
    )
    const sortParams = useMemo(() => getSortParams(sortBy), [sortBy])
    const groupIds = communityMeta?.challengeFilter?.groupIds

    const listingParams = useMemo<ChallengeListParams>(() => ({
        ...tabParams,
        ...sidebarParams,
        ...sortParams,
        groups: groupIds?.length ? groupIds : undefined,
        name: search.trim() || undefined,
        page,
        tracks: selectedTracks.length ? selectedTracks : undefined,
        types: selectedTypes.length ? selectedTypes : undefined,
    }), [
        groupIds,
        page,
        search,
        selectedTracks,
        selectedTypes,
        sidebarParams,
        sortParams,
        tabParams,
    ])

    const {
        challenges,
        isLoading: isLoadingChallenges,
        total,
    }: UseChallengesResult = useChallenges(listingParams)

    const listingKey = useMemo(() => JSON.stringify({
        ...tabParams,
        ...sidebarParams,
        ...sortParams,
        groups: groupIds ?? [],
        name: search.trim(),
        tracks: selectedTracks,
        types: selectedTypes,
    }), [
        groupIds,
        search,
        selectedTracks,
        selectedTypes,
        sidebarParams,
        sortParams,
        tabParams,
    ])
    const listingPath = useMemo(() => {
        const route = withLeadingSlash(`${rootRoute}/${challengeListingRouteId}`)
            .replace(/\/{2,}/g, '/')
        const query = searchParams.toString()

        return query
            ? `${route}?${query}`
            : route
    }, [searchParams])
    const breadcrumbs = useMemo<Array<BreadcrumbItemModel>>(() => {
        const items: Array<BreadcrumbItemModel> = [
            {
                name: 'Community',
                url: rootRoute || '/',
            },
        ]

        if (communityMeta?.communityName) {
            items.push({
                name: communityMeta.communityName,
                url: listingPath,
            })
        }

        items.push({
            name: 'Challenges',
            url: listingPath,
        })

        return items
    }, [communityMeta?.communityName, listingPath])
    const challengeTableColumns = useMemo<ReadonlyArray<TableColumn<ChallengeInfo>>>(() => [
        {
            columnId: 'challenge',
            isSortable: false,
            label: 'Challenges',
            renderer: (challenge: ChallengeInfo): JSX.Element => (
                <ChallengeCard
                    challenge={challenge}
                    prizeMode={prizeMode}
                />
            ),
            type: 'element',
        },
    ], [prizeMode])

    useEffect(() => {
        setAllChallenges([])
        setPage(1)
    }, [listingKey])

    useEffect(() => {
        if (!isLoggedIn && activeBucket === SidebarBucket.MyChallenges) {
            setActiveBucket(SidebarBucket.OpenForRegistration)
        }
    }, [activeBucket, isLoggedIn])

    useEffect(() => {
        setAllChallenges(previous => {
            if (page <= 1) {
                return challenges
            }

            const merged = new Map(previous.map(challenge => [challenge.id, challenge]))
            challenges.forEach(challenge => {
                merged.set(challenge.id, challenge)
            })

            return Array.from(merged.values())
        })
    }, [challenges, page])

    const hasFilterSelection = selectedTracks.length > 0 && selectedTypes.length > 0
    const visibleChallenges = hasFilterSelection ? allChallenges : []
    const isLoading = (isLoadingChallenges || (!!communityId && isLoadingCommunityMeta)) && hasFilterSelection
    const title = communityMeta?.communityName
        ? `${communityMeta.communityName} Challenges`
        : 'Challenges'
    const panelTitle = activeTab === ChallengeBucket.ActiveChallenges
        ? SIDEBAR_BUCKET_LABELS[activeBucket]
        : BUCKET_LABELS[activeTab]

    const handleTabChange = useCallback((bucket: ChallengeBucket): void => {
        setActiveTab(bucket)
        setPage(1)
    }, [])
    const handleBucketChange = useCallback((bucket: SidebarBucket): void => {
        setActiveBucket(bucket)
        setPage(1)
    }, [])
    const handleTrackToggle = useCallback((track: string, on: boolean): void => {
        setTracks(previous => ({
            ...previous,
            [track]: on,
        }))
        setPage(1)
    }, [])
    const handleTypeToggle = useCallback((type: string, on: boolean): void => {
        setTypes(previous => ({
            ...previous,
            [type]: on,
        }))
        setPage(1)
    }, [])
    const handleClearFilters = useCallback((): void => {
        setSearch('')
        setSortBy(DEFAULT_SORT)
        setTracks(DEFAULT_TRACKS)
        setTypes(DEFAULT_TYPES)
        setPage(1)
    }, [])
    const handleSortChange = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
        setSortBy(event.target.value)
        setPage(1)
    }, [])
    const handleLoadMore = useCallback((): void => {
        setPage(previous => previous + 1)
    }, [])
    const handleEngagementsTabClick = useCallback((): void => {
        window.location.assign(EnvironmentConfig.ENGAGEMENTS_URL)
    }, [])
    const tabClickHandlers: Record<ChallengeBucket, () => void> = useMemo(() => {
        const handlers = {} as Record<ChallengeBucket, () => void>

        Object.values(ChallengeBucket)
            .forEach(bucket => {
                if (bucket === ChallengeBucket.Engagements) {
                    handlers[bucket] = handleEngagementsTabClick
                    return
                }

                handlers[bucket] = () => handleTabChange(bucket)
            })

        return handlers
    }, [handleEngagementsTabClick, handleTabChange])

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <Breadcrumb
                    items={breadcrumbs}
                    renderInline
                />
                <h1 className={styles.title}>{title}</h1>
            </header>

            <div className={styles.tabs}>
                <div
                    aria-label='Challenge buckets'
                    className={styles.tabList}
                    role='tablist'
                >
                    {tabs.map(tab => (
                        <button
                            aria-selected={activeTab === tab.id}
                            className={classNames(
                                styles.tabButton,
                                activeTab === tab.id && styles.tabButtonActive,
                            )}
                            id={`challenge-tab-${tab.id}`}
                            key={tab.id}
                            onClick={tabClickHandlers[tab.id]}
                            role='tab'
                            type='button'
                        >
                            {tab.title}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.body}>
                <ChallengeFilters
                    activeBucket={activeBucket}
                    isLoggedIn={isLoggedIn}
                    onBucketChange={handleBucketChange}
                    onClear={handleClearFilters}
                    onSearchChange={setSearch}
                    onTrackToggle={handleTrackToggle}
                    onTypeToggle={handleTypeToggle}
                    search={search}
                    tracks={tracks}
                    types={types}
                />

                <div className={styles.mainPanel}>
                    <div className={styles.panelHeader}>
                        <h2 className={styles.panelTitle}>{panelTitle}</h2>
                        <div className={styles.sort}>
                            <label className={styles.sortLabel} htmlFor='challenge-sort'>
                                Sort By
                            </label>
                            <select
                                className={styles.sortSelect}
                                id='challenge-sort'
                                onChange={handleSortChange}
                                value={sortBy}
                            >
                                {SORT_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <LoadingSpinner hide={!isLoading} />

                    {!isLoading && visibleChallenges.length === 0 && (
                        <div className={styles.emptyState}>
                            No challenges found.
                        </div>
                    )}

                    {visibleChallenges.length > 0 && (
                        <Table
                            className={styles.cardsTable}
                            columns={challengeTableColumns}
                            data={visibleChallenges}
                            disableSorting
                            preventDefault
                        />
                    )}

                    {!isLoading && visibleChallenges.length < total && (
                        <div className={styles.loadMore}>
                            <Button
                                label='Load More'
                                onClick={handleLoadMore}
                                primary
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export default ChallengeListing
