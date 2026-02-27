import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { profileContext, ProfileContextData } from '~/libs/core'
import {
    Breadcrumb,
    BreadcrumbItemModel,
    Button,
    LoadingSpinner,
    Table,
    TableColumn,
    TabsNavbar,
    TabsNavItem,
} from '~/libs/ui'

import { challengeListingRouteId, rootRoute } from '../../config/routes.config'
import {
    bucketToParams,
    BUCKET_LABELS,
    ChallengeBucket,
    ChallengeInfo,
    ChallengeListParams,
    useChallenges,
    UseChallengesResult,
    useCommunityMeta,
    UseCommunityMetaResult,
} from '../../lib'

import { ChallengeCard, PrizeMode } from './ChallengeCard'
import { ChallengeFilters } from './ChallengeFilters'
import styles from './ChallengeListing.module.scss'

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
 * Community challenge listing route component with tabs, filters and paginated challenge rows.
 *
 * @returns Challenge listing page content.
 */
const ChallengeListing: FC = () => {
    const [searchParams] = useSearchParams()
    const { isLoggedIn, profile }: ProfileContextData = useContext(profileContext)
    const [activeBucket, setActiveBucket] = useState<ChallengeBucket>(
        ChallengeBucket.OpenForRegistration,
    )
    const [search, setSearch] = useState<string>('')
    const [sortBy, setSortBy] = useState<string>('startDate')
    const [page, setPage] = useState<number>(1)
    const [allChallenges, setAllChallenges] = useState<ChallengeInfo[]>([])

    const prizeMode: PrizeMode = searchParams.get('prizeMode') === 'points'
        ? 'points'
        : 'money-usd'
    const communityId = searchParams.get('communityId') ?? undefined
    const memberId = profile?.userId ? `${profile.userId}` : undefined
    const { communityMeta, isLoading: isLoadingCommunityMeta }: UseCommunityMetaResult
        = useCommunityMeta(communityId)

    const tabs = useMemo<ReadonlyArray<TabsNavItem<ChallengeBucket>>>(() => (
        Object.values(ChallengeBucket)
            .filter(bucket => isLoggedIn || (bucket !== ChallengeBucket.My && bucket !== ChallengeBucket.MyPast))
            .map(bucket => ({
                id: bucket,
                title: BUCKET_LABELS[bucket],
            }))
    ), [isLoggedIn])

    const bucketParams = useMemo(
        () => bucketToParams(activeBucket, memberId),
        [activeBucket, memberId],
    )
    const sortParams = useMemo(() => getSortParams(sortBy), [sortBy])
    const groupIds = communityMeta?.challengeFilter?.groupIds

    const listingParams = useMemo<ChallengeListParams>(() => ({
        ...bucketParams,
        ...sortParams,
        groups: groupIds?.length ? groupIds : undefined,
        page,
    }), [bucketParams, groupIds, page, sortParams])

    const {
        challenges,
        isLoading: isLoadingChallenges,
        total,
    }: UseChallengesResult = useChallenges(listingParams)

    const listingKey = useMemo(() => JSON.stringify({
        ...bucketParams,
        ...sortParams,
        groups: groupIds ?? [],
    }), [bucketParams, groupIds, sortParams])
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
        if (!isLoggedIn && (activeBucket === ChallengeBucket.My || activeBucket === ChallengeBucket.MyPast)) {
            setActiveBucket(ChallengeBucket.OpenForRegistration)
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

    const filteredChallenges = useMemo(() => {
        const normalizedSearch = search.trim()
            .toLowerCase()
        if (!normalizedSearch) {
            return allChallenges
        }

        return allChallenges.filter(challenge => (
            challenge.name.toLowerCase()
                .includes(normalizedSearch)
        ))
    }, [allChallenges, search])

    const isLoading = isLoadingChallenges || (!!communityId && isLoadingCommunityMeta)
    const title = communityMeta?.communityName
        ? `${communityMeta.communityName} Challenges`
        : 'Challenges'
    const handleBucketChange = useCallback((bucket: ChallengeBucket): void => {
        setActiveBucket(bucket)
        setPage(1)
    }, [])
    const handleClearFilters = useCallback((): void => {
        setSearch('')
        setSortBy('startDate')
        setPage(1)
    }, [])
    const handleSortChange = useCallback((value: string): void => {
        setSortBy(value)
        setPage(1)
    }, [])
    const handleLoadMore = useCallback((): void => {
        setPage(previous => previous + 1)
    }, [])

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
                <TabsNavbar
                    defaultActive={activeBucket}
                    onChange={handleBucketChange}
                    tabs={tabs}
                />
            </div>

            <ChallengeFilters
                onClear={handleClearFilters}
                onSearchChange={setSearch}
                onSortChange={handleSortChange}
                search={search}
                sortBy={sortBy}
            />

            <LoadingSpinner hide={!isLoading} />

            {!isLoading && filteredChallenges.length === 0 && (
                <div className={styles.emptyState}>
                    No challenges found.
                </div>
            )}

            {filteredChallenges.length > 0 && (
                <Table
                    className={styles.cardsTable}
                    columns={challengeTableColumns}
                    data={filteredChallenges}
                    disableSorting
                    preventDefault
                />
            )}

            {!isLoading && allChallenges.length < total && (
                <div className={styles.loadMore}>
                    <Button
                        label='Load More'
                        onClick={handleLoadMore}
                        primary
                    />
                </div>
            )}
        </section>
    )
}

export default ChallengeListing
