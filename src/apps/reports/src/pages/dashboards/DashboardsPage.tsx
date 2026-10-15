import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'

import {
    Button,
    IconOutline,
    PageTitle,
} from '~/libs/ui'

import {
    downloadBlobFile,
    downloadDashboardsCsv,
} from '../../lib/services'
import { handleError } from '../../lib/utils'

import { DashboardCard } from './DashboardCard'
import { dashboardSlugs } from './dashboard.config'
import {
    buildDashboardCsvFileName,
    getDashboardRange,
} from './dashboard.utils'
import styles from './Dashboards.module.scss'

const pageTitle = 'Dashboards'

/**
 * Reports dashboard landing page with the latest six months of all widgets.
 *
 * Cards render immediately and load their previews independently. Refresh reloads
 * every preview; CSV export uses the same UTC range without blocking navigation.
 *
 * @returns Dashboard landing page.
 * @throws Does not throw. Cards show inline retries; CSV failures produce a toast.
 */
export const DashboardsPage: FC = () => {
    const range = useMemo(() => getDashboardRange(), [])
    const [isDownloading, setIsDownloading] = useState<boolean>(false)
    const [refreshKey, setRefreshKey] = useState<number>(0)

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
            <div className={styles.page}>
                <header className={styles.pageHeader}>
                    <div>
                        <h1>Dashboards</h1>
                        <p>Visual insights and key metrics about the Topcoder platform.</p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button
                            icon={IconOutline.RefreshIcon}
                            iconToLeft
                            onClick={handleRefresh}
                            secondary
                        >
                            Refresh
                        </Button>
                        <Button
                            disabled={isDownloading}
                            icon={IconOutline.DownloadIcon}
                            iconToLeft
                            onClick={handleDownload}
                            primary
                        >
                            {isDownloading ? 'Generating CSV…' : 'Download CSV'}
                        </Button>
                    </div>
                </header>

                <section
                    aria-label='Platform dashboard summaries'
                    className={styles.dashboardGrid}
                >
                    {dashboardSlugs.map(slug => (
                        <DashboardCard
                            dashboard={slug}
                            key={slug}
                            range={range}
                            refreshKey={refreshKey}
                        />
                    ))}
                </section>
            </div>
        </>
    )
}

export default DashboardsPage
