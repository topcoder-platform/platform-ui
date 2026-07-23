import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    Button,
    IconOutline,
    LoadingSpinner,
    PageTitle,
} from '~/libs/ui'

import {
    DashboardsResponse,
    downloadBlobFile,
    downloadDashboardsCsv,
    fetchDashboards,
} from '../../lib/services'
import { handleError } from '../../lib/utils'

import { DashboardCard } from './DashboardCard'
import {
    dashboardSlugs,
    getDashboardResponse,
} from './dashboard.config'
import {
    buildDashboardCsvFileName,
    getDashboardRange,
} from './dashboard.utils'
import styles from './Dashboards.module.scss'

const pageTitle = 'Dashboards'

/**
 * Extracts a user-facing request error without assuming a particular HTTP client shape.
 *
 * @param error Unknown reports-api failure.
 * @returns A concise error message suitable for an inline alert.
 * @throws Does not throw.
 */
function getDashboardErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message
    }

    return 'Dashboard data could not be loaded. Please try again.'
}

/**
 * Reports dashboard landing page with the latest six months of all three widgets.
 *
 * The page supports an explicit refresh and a consolidated CSV export for the
 * same UTC range shown by the cards.
 *
 * @returns Dashboard landing page.
 * @throws Does not throw. API failures are surfaced as an inline retry state and toast.
 */
export const DashboardsPage: FC = () => {
    const range = useMemo(() => getDashboardRange(), [])
    const [dashboards, setDashboards] = useState<DashboardsResponse>()
    const [errorMessage, setErrorMessage] = useState<string>()
    const [isDownloading, setIsDownloading] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [refreshKey, setRefreshKey] = useState<number>(0)

    useEffect(() => {
        let isActive = true

        setErrorMessage(undefined)
        setDashboards(undefined)
        setIsLoading(true)
        fetchDashboards(range)
            .then(response => {
                if (isActive) {
                    setDashboards(response)
                }
            })
            .catch(error => {
                if (isActive) {
                    setErrorMessage(getDashboardErrorMessage(error))
                    handleError(error)
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false)
                }
            })

        return () => {
            isActive = false
        }
    }, [range, refreshKey])

    const handleRefresh = useCallback(() => {
        setRefreshKey(current => current + 1)
    }, [])

    const handleDownload = useCallback(async (): Promise<void> => {
        try {
            setIsDownloading(true)
            const blob = await downloadDashboardsCsv(range)
            downloadBlobFile(blob, buildDashboardCsvFileName('all', range))
        } catch (error) {
            handleError(error)
        } finally {
            setIsDownloading(false)
        }
    }, [range])

    return (
        <>
            <PageTitle>{pageTitle}</PageTitle>
            {(isLoading || isDownloading) && (
                <LoadingSpinner
                    message={isDownloading ? 'Generating dashboard CSV…' : 'Loading dashboards…'}
                    overlay
                />
            )}

            <div className={styles.page}>
                <header className={styles.pageHeader}>
                    <div>
                        <h1>Dashboards</h1>
                        <p>Visual insights and key metrics about the Topcoder platform.</p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button
                            disabled={isLoading}
                            icon={IconOutline.RefreshIcon}
                            iconToLeft
                            onClick={handleRefresh}
                            secondary
                        >
                            Refresh
                        </Button>
                        <Button
                            disabled={isDownloading || isLoading || !dashboards}
                            icon={IconOutline.DownloadIcon}
                            iconToLeft
                            onClick={handleDownload}
                            primary
                        >
                            Download CSV
                        </Button>
                    </div>
                </header>

                {errorMessage && !dashboards && (
                    <section className={styles.errorState} role='alert'>
                        <IconOutline.ExclamationCircleIcon aria-hidden='true' />
                        <div>
                            <h2>Unable to load dashboards</h2>
                            <p>{errorMessage}</p>
                            <Button onClick={handleRefresh} secondary>
                                Try again
                            </Button>
                        </div>
                    </section>
                )}

                {dashboards && (
                    <section
                        aria-label='Platform dashboard summaries'
                        className={styles.dashboardGrid}
                    >
                        {dashboardSlugs.map(slug => (
                            <DashboardCard
                                dashboard={slug}
                                key={slug}
                                response={getDashboardResponse(dashboards, slug)}
                            />
                        ))}
                    </section>
                )}
            </div>
        </>
    )
}

export default DashboardsPage
