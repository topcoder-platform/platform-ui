import { FC, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button, IconOutline, LoadingSpinner } from '~/libs/ui'

import { buildReportsPath, dashboardsPageRouteId } from '../../config/routes.config'
import { DashboardQuery, DashboardSlug, fetchDashboard } from '../../lib/services'

import {
    dashboardDefinitions,
    DashboardResponse,
} from './dashboard.config'
import { DashboardChart } from './DashboardChart'
import styles from './Dashboards.module.scss'

type DashboardCardProps = {
    dashboard: DashboardSlug
    range: DashboardQuery
    refreshKey: number
}

/**
 * Loads one preview independently while keeping its heading and drill-down link visible.
 * Failed requests can be retried without reloading other cards.
 *
 * @param props Dashboard identity, UTC range, and shared refresh counter.
 * @returns Compact chart card used on the Dashboards landing page.
 * @throws Does not throw. Request failures are rendered as an inline retry state.
 */
export const DashboardCard: FC<DashboardCardProps> = props => {
    const definition = dashboardDefinitions[props.dashboard]
    const [response, setResponse] = useState<DashboardResponse>()
    const [errorMessage, setErrorMessage] = useState<string>()
    const [retryKey, setRetryKey] = useState<number>(0)

    useEffect(() => {
        let isActive = true

        setResponse(undefined)
        setErrorMessage(undefined)
        fetchDashboard(props.dashboard, props.range)
            .then(data => {
                if (isActive) {
                    setResponse(data)
                }
            })
            .catch(error => {
                if (isActive) {
                    setErrorMessage(
                        error instanceof Error && error.message
                            ? error.message
                            : 'Dashboard data could not be loaded. Please try again.',
                    )
                }
            })

        return () => {
            isActive = false
        }
    }, [props.dashboard, props.range, props.refreshKey, retryKey])

    /**
     * Starts a fresh request for this card after a failed preview load.
     *
     * @returns Nothing.
     * @throws Does not throw; the request effect handles failures inline.
     */
    const handleRetry = useCallback(() => {
        setRetryKey(current => current + 1)
    }, [])

    return (
        <article className={styles.dashboardCard}>
            <header className={styles.cardHeader}>
                <div>
                    <h2>
                        <span>
                            {definition.index}
                            .
                        </span>
                        {' '}
                        {definition.title}
                    </h2>
                    <p>{definition.subtitle}</p>
                </div>
            </header>

            <div className={styles.cardChart}>
                {response ? (
                    <DashboardChart compact response={response} />
                ) : errorMessage ? (
                    <div className={styles.cardError} role='alert'>
                        <p>{errorMessage}</p>
                        <Button onClick={handleRetry} secondary>
                            Try again
                        </Button>
                    </div>
                ) : (
                    <div className={styles.cardLoading} role='status'>
                        <LoadingSpinner inline message={`Loading ${definition.title}…`} />
                    </div>
                )}
            </div>

            <footer className={styles.cardFooter}>
                <Link to={buildReportsPath(dashboardsPageRouteId, props.dashboard)}>
                    View full dashboard
                    <IconOutline.ArrowRightIcon aria-hidden='true' />
                </Link>
            </footer>
        </article>
    )
}

export default DashboardCard
