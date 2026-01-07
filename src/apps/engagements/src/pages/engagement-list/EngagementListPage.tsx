import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useProfileContext } from '~/libs/core'
import { Button, ContentLayout, IconOutline, LoadingSpinner } from '~/libs/ui'
import { Pagination } from '~/apps/admin/src/lib/components/common/Pagination'

import { Engagement, EngagementStatus } from '../../lib/models'
import { getEngagements } from '../../lib/services'
import { EngagementCard, EngagementFilters } from '../../components'
import { rootRoute } from '../../engagements.routes'

import styles from './EngagementListPage.module.scss'

interface FilterState {
    search?: string
    skills?: string[]
    countries?: string[]
    status?: string
}

const DEFAULT_FILTERS: FilterState = {
    search: '',
    skills: [],
    countries: [],
    status: EngagementStatus.OPEN,
}

const PER_PAGE = 12

const EngagementListPage: FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { isLoggedIn } = useProfileContext()

    const [engagements, setEngagements] = useState<Engagement[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
    const [redirectMessage, setRedirectMessage] = useState<string | null>(null)
    const requestIdRef = useRef(0)

    useEffect(() => {
        const state = location.state as { engagementError?: string } | null
        if (state?.engagementError) {
            setRedirectMessage(state.engagementError)
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location.pathname, location.state, navigate])

    const fetchEngagements = useCallback(async (): Promise<void> => {
        const requestId = ++requestIdRef.current
        setLoading(true)
        setError(null)
        try {
            const response = await getEngagements({
                page,
                perPage: PER_PAGE,
                search: filters.search || undefined,
                skills: filters.skills,
                countries: filters.countries,
                status: filters.status,
            })
            if (requestId !== requestIdRef.current) {
                return
            }
            setEngagements(response.data)
            setTotalPages(response.totalPages || 1)
        } catch (err) {
            if (requestId !== requestIdRef.current) {
                return
            }
            setError('Unable to load engagement opportunities. Please try again.')
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false)
            }
        }
    }, [filters, page])

    useEffect(() => {
        fetchEngagements()
    }, [fetchEngagements])

    const handleFilterChange = useCallback((nextFilters: FilterState) => {
        setFilters(nextFilters)
        setPage(1)
    }, [])

    const handlePageChange = useCallback((nextPage: number) => {
        setPage(nextPage)
    }, [])

    const handleCardClick = useCallback((nanoId: string) => {
        navigate(`${rootRoute}/${nanoId}`)
    }, [navigate])

    const handleRetry = useCallback(() => {
        fetchEngagements()
    }, [fetchEngagements])

    const handleClearFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS)
        setPage(1)
    }, [])

    const skeletonCards = useMemo(() => Array.from({ length: 6 }, (_, index) => index), [])

    const showEmptyState = !loading && !error && engagements.length === 0

    return (
        <ContentLayout title='Engagement Opportunities' contentClass={styles.pageContent}>
            {redirectMessage && (
                <div className={styles.redirectMessage}>
                    <IconOutline.ExclamationIcon className={styles.redirectIcon} />
                    <span>{redirectMessage}</span>
                </div>
            )}
            {!isLoggedIn && (
                <div className={styles.authHint}>
                    <IconOutline.InformationCircleIcon className={styles.authIcon} />
                    <span>Sign in to apply for engagements.</span>
                </div>
            )}
            <EngagementFilters filters={filters} onFilterChange={handleFilterChange} />
            {loading && (
                <div className={styles.loadingState}>
                    <LoadingSpinner className={styles.loadingSpinner} />
                    <span>Loading engagement opportunities...</span>
                </div>
            )}
            {error && (
                <div className={styles.errorState}>
                    <IconOutline.ExclamationIcon className={styles.errorIcon} />
                    <div>
                        <p className={styles.errorText}>{error}</p>
                        <Button label='Retry' onClick={handleRetry} primary />
                    </div>
                </div>
            )}
            {showEmptyState && (
                <div className={styles.emptyState}>
                    <IconOutline.SearchIcon className={styles.emptyIcon} />
                    <h3>No engagements found</h3>
                    <p>Try adjusting your filters or clearing them to see more opportunities.</p>
                    <Button label='Clear Filters' secondary onClick={handleClearFilters} />
                </div>
            )}
            {!error && (
                <div className={styles.grid}>
                    {loading ? skeletonCards.map(card => (
                        <div key={`skeleton-${card}`} className={styles.skeletonCard} />
                    )) : engagements.map(engagement => (
                        <EngagementCard
                            key={engagement.nanoId}
                            engagement={engagement}
                            onClick={() => handleCardClick(engagement.nanoId)}
                        />
                    ))}
                </div>
            )}
            {!error && engagements.length > 0 && (
                <div className={styles.pagination}>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        disabled={loading}
                    />
                </div>
            )}
        </ContentLayout>
    )
}

export default EngagementListPage
