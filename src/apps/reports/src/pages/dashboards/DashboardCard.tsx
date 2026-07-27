import { FC } from 'react'
import { Link } from 'react-router-dom'

import { IconOutline } from '~/libs/ui'

import { buildReportsPath, dashboardsPageRouteId } from '../../config/routes.config'
import { DashboardSlug } from '../../lib/services'

import {
    dashboardDefinitions,
    DashboardResponse,
} from './dashboard.config'
import { DashboardChart } from './DashboardChart'
import styles from './Dashboards.module.scss'

type DashboardCardProps = {
    dashboard: DashboardSlug
    response: DashboardResponse
}

/**
 * Renders a dashboard preview card and its drill-down navigation link.
 *
 * @param props Dashboard identity and monthly API response.
 * @returns Compact chart card used on the Dashboards landing page.
 * @throws Does not throw.
 */
export const DashboardCard: FC<DashboardCardProps> = props => {
    const definition = dashboardDefinitions[props.dashboard]

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
                <DashboardChart
                    compact
                    dashboard={props.dashboard}
                    months={props.response.months}
                />
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
