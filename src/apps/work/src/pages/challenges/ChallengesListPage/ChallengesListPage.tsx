import {
    FC,
    MutableRefObject,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

import { TableLoading } from '~/apps/admin/src/lib'
import { PageWrapper } from '~/apps/review/src/lib'
import { Button } from '~/libs/ui'

import {
    PAGE_SIZE,
} from '../../../lib'
import {
    WorkAppContext,
} from '../../../lib/contexts'
import {
    ChallengesFilter,
    ChallengesTable,
    Pagination,
} from '../../../lib/components'
import {
    useFetchChallenges,
    UseFetchChallengesParams,
    UseFetchChallengesResult,
    useFetchChallengeTypes,
    UseFetchChallengeTypesResult,
    useFetchProjects,
    UseFetchProjectsResult,
} from '../../../lib/hooks'
import {
    ChallengeFilters,
    WorkAppContextModel,
} from '../../../lib/models'

import styles from './ChallengesListPage.module.scss'

const DEFAULT_FILTERS: ChallengeFilters = {
    endDateEnd: undefined,
    endDateStart: undefined,
    name: undefined,
    projectId: undefined,
    startDateEnd: undefined,
    startDateStart: undefined,
    status: undefined,
    type: undefined,
}

interface ListEndObserverParams {
    canLoadMorePages: boolean
    hasError: boolean
    isLoading: boolean
    isValidating: boolean
    supportsInfiniteScroll: boolean
    targetElement: HTMLDivElement | null
}

function canObserveListEnd(params: ListEndObserverParams): params is ListEndObserverParams & {
    targetElement: HTMLDivElement
} {
    return params.supportsInfiniteScroll
        && !!params.targetElement
        && !params.isLoading
        && !params.isValidating
        && params.canLoadMorePages
        && !params.hasError
}

function canRenderPagination(hasError: boolean, totalChallenges: number): boolean {
    return !hasError && totalChallenges > 0
}

function supportsIntersectionObserver(): boolean {
    return typeof window !== 'undefined'
        && 'IntersectionObserver' in window
}

function useErrorToast(
    error: Error | undefined,
    messageRef: MutableRefObject<string | undefined>,
): void {
    useEffect(() => {
        const message = error?.message
        if (message && messageRef.current !== message) {
            messageRef.current = message
            toast.error(message)
        }
    }, [error, messageRef])
}

interface RenderChallengesContentParams {
    challengeTypes: UseFetchChallengeTypesResult['challengeTypes']
    challengesResult: UseFetchChallengesResult
    listEndRef: MutableRefObject<HTMLDivElement | null>
    onPageChange: (newPage: number) => void
    onPerPageChange: (newPerPage: number) => void
    onSort: (fieldName: string) => void
    page: number
    perPage: number
    shouldShowInfiniteLoading: boolean
    shouldShowInfiniteSentinel: boolean
    shouldShowPagination: boolean
    sortBy: string
    sortOrder: 'asc' | 'desc'
    totalChallenges: number
}

function renderChallengesContent(params: RenderChallengesContentParams): JSX.Element {
    if (params.challengesResult.isLoading) {
        return <TableLoading />
    }

    return (
        <>
            <ChallengesTable
                challenges={params.challengesResult.challenges}
                challengeTypes={params.challengeTypes}
                isLoading={params.challengesResult.isValidating && params.challengesResult.challenges.length === 0}
                sortBy={params.sortBy}
                sortOrder={params.sortOrder}
                onSort={params.onSort}
            />
            {params.shouldShowInfiniteSentinel
                ? (
                    <>
                        <div ref={params.listEndRef} className={styles.scrollSentinel} />
                        {params.shouldShowInfiniteLoading
                            ? <div className={styles.loadingMore}>Loading more challenges...</div>
                            : undefined}
                    </>
                )
                : undefined}
            {params.shouldShowPagination
                ? (
                    <Pagination
                        page={params.challengesResult.metadata.page ?? params.page}
                        perPage={params.challengesResult.metadata.perPage ?? params.perPage}
                        total={params.totalChallenges}
                        onPageChange={params.onPageChange}
                        onPerPageChange={params.onPerPageChange}
                    />
                )
                : undefined}
        </>
    )
}

export const ChallengesListPage: FC = () => {
    const {
        isAdmin,
        isManager,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const [filters, setFilters] = useState<ChallengeFilters>(DEFAULT_FILTERS)
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(PAGE_SIZE)
    const [sortBy, setSortBy] = useState<string>('startDate')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const listEndRef = useRef<HTMLDivElement | null>(null)
    const isPrivilegedUser = isAdmin || isManager
    const supportsInfiniteScroll = supportsIntersectionObserver()

    const fetchParams: UseFetchChallengesParams = {
        appendResults: supportsInfiniteScroll,
        ...filters,
        page,
        perPage,
        sortBy,
        sortOrder,
    }

    const challengesResult: UseFetchChallengesResult = useFetchChallenges(fetchParams)
    const challengeTypesResult: UseFetchChallengeTypesResult = useFetchChallengeTypes()
    const projectsResult: UseFetchProjectsResult = useFetchProjects({
        memberOnly: !isPrivilegedUser,
    })

    const challengeErrorRef = useRef<string | undefined>()
    const challengeTypesErrorRef = useRef<string | undefined>()
    const projectsErrorRef = useRef<string | undefined>()

    useErrorToast(challengesResult.error, challengeErrorRef)
    useErrorToast(challengeTypesResult.error, challengeTypesErrorRef)
    useErrorToast(projectsResult.error, projectsErrorRef)

    const breadCrumb = useMemo(
        () => [{
            index: 1,
            label: 'Challenges',
        }],
        [],
    )

    const handleFiltersChange = useCallback((newFilters: ChallengeFilters) => {
        setFilters(newFilters)
        setPage(1)
    }, [])

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
    }, [])

    const handlePerPageChange = useCallback((newPerPage: number) => {
        setPerPage(newPerPage)
        setPage(1)
    }, [])

    const handleSort = useCallback((fieldName: string) => {
        setPage(1)

        if (fieldName === sortBy) {
            setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'))
            return
        }

        setSortBy(fieldName)
        setSortOrder('desc')
    }, [sortBy])

    const handleRetry = useCallback(() => {
        challengesResult.mutate()
            .catch(() => undefined)
    }, [challengesResult])

    const totalChallenges = challengesResult.metadata.total ?? 0
    const currentPage = challengesResult.metadata.page ?? page
    const totalPages = challengesResult.metadata.totalPages ?? 0
    const canLoadMorePages = currentPage < totalPages
    const shouldShowPagination = canRenderPagination(!!challengesResult.error, totalChallenges)
    const shouldShowInfiniteSentinel = supportsInfiniteScroll && shouldShowPagination
    const shouldShowInfiniteLoading = shouldShowInfiniteSentinel
        && challengesResult.isValidating
        && challengesResult.challenges.length > 0

    const projectOptions = useMemo(
        () => projectsResult.projects
            .map(project => ({
                label: project.name,
                value: String(project.id),
            }))
            .sort((projectA, projectB) => projectA.label.localeCompare(projectB.label)),
        [projectsResult.projects],
    )

    useEffect(() => {
        const listEndElement = listEndRef.current
        const observerParams: ListEndObserverParams = {
            canLoadMorePages,
            hasError: !!challengesResult.error,
            isLoading: challengesResult.isLoading,
            isValidating: challengesResult.isValidating,
            supportsInfiniteScroll,
            targetElement: listEndElement,
        }

        if (!canObserveListEnd(observerParams)) {
            return undefined
        }

        const observer = new IntersectionObserver(
            entries => {
                const [entry] = entries

                if (!entry?.isIntersecting) {
                    return
                }

                setPage(current => (
                    current < totalPages
                        ? current + 1
                        : current
                ))
            },
            {
                rootMargin: '200px 0px',
            },
        )

        observer.observe(observerParams.targetElement)

        return () => {
            observer.disconnect()
        }
    }, [
        canLoadMorePages,
        challengesResult.error,
        challengesResult.isLoading,
        challengesResult.isValidating,
        supportsInfiniteScroll,
        totalPages,
    ])

    return (
        <PageWrapper
            pageTitle='Challenges'
            breadCrumb={breadCrumb}
            rightHeader={(
                <Link to='/challenges/new' className={styles.newChallengeButton}>
                    <Button
                        label='Create Challenge'
                        primary
                        size='lg'
                    />
                </Link>
            )}
        >
            <div className={styles.totalChallenges}>
                {totalChallenges}
                {' '}
                challenges
            </div>

            <ChallengesFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                challengeTypes={challengeTypesResult.challengeTypes}
                dashboardMode
                projectOptions={projectOptions}
                isLoadingChallengeTypes={challengeTypesResult.isLoading}
            />

            {challengesResult.error && (
                <div className={styles.errorBanner}>
                    <span>{challengesResult.error.message}</span>
                    <Button
                        secondary
                        size='lg'
                        label='Retry'
                        onClick={handleRetry}
                    />
                </div>
            )}

            {renderChallengesContent({
                challengesResult,
                challengeTypes: challengeTypesResult.challengeTypes,
                listEndRef,
                onPageChange: handlePageChange,
                onPerPageChange: handlePerPageChange,
                onSort: handleSort,
                page,
                perPage,
                shouldShowInfiniteLoading,
                shouldShowInfiniteSentinel,
                shouldShowPagination,
                sortBy,
                sortOrder,
                totalChallenges,
            })}
        </PageWrapper>
    )
}

export default ChallengesListPage
