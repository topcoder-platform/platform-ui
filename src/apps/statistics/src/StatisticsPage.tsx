import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'
import useSWR from 'swr'

import { AppSubdomain, EnvironmentConfig } from '~/config'

import { sections } from './reports'
import { fetchStatistics, formatValue, reportOptions } from './statistics.service'
import ReportTable from './ReportTable'
import styles from './StatisticsPage.module.scss'

const root = EnvironmentConfig.SUBDOMAIN === AppSubdomain.statistics ? '' : '/statistics'
interface TotalProps { field: string; label: string; path: string }
const totals: TotalProps[] = [
    { field: 'user.count', label: 'Community members', path: 'general/member-count' },
    { field: 'challenge.count', label: 'Completed challenges', path: 'general/completed-challenges' },
    { field: 'total', label: 'Total prizes paid', path: 'general/total-prizes' },
]

const Total: FC<TotalProps> = (props: TotalProps) => {
    const result = useSWR(props.path, fetchStatistics, reportOptions)
    function retry(): void { result.mutate() }
    return (
        <div className={styles.total}>
            <span>{props.label}</span>
            {result.error ? <button type='button' onClick={retry}>Retry loading total</button> : (
                <strong>
                    {result.data
                        ? `${props.field === 'total' ? '$' : ''}${formatValue(result.data[0]?.[props.field])}`
                        : 'Loading…'}
                </strong>
            )}
        </div>
    )
}

const StatisticsPage: FC = () => {
    const location = useLocation()
    const slug = location.pathname.replace(/^\/statistics(?=\/|$)/, '')
        .replace(/^\/|\/$/g, '')
    const section = sections.find(item => (
        item.id === (slug || 'general') || (slug === 'mm' && item.id === 'marathon-match')
    ))
    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <p>THE TOPCODER COMMUNITY</p>
                <h1>Statistics</h1>
                <p>Explore the members, challenges, and achievements that shape our community.</p>
            </header>
            <div className={styles.totals}>{totals.map(total => <Total key={total.path} {...total} />)}</div>
            <nav className={styles.nav} aria-label='Statistics categories'>
                {sections.map(item => (
                    <Link
                        key={item.id}
                        to={`${root}/${item.id === 'general' ? '' : item.id}`}
                        aria-current={section?.id === item.id ? 'page' : undefined}
                    >
                        {item.title}
                    </Link>
                ))}
            </nav>
            {!section ? (
                <p>
                    Statistics category not found.
                    {' '}
                    <Link to={`${root}/`}>View general statistics</Link>
                </p>
            ) : (
                <>
                    {(section.id === 'srm' || section.id === 'marathon-match') && (
                        <p className={styles.note}>These reports contain historical competition statistics.</p>
                    )}
                    <div className={styles.reports}>
                        {section.reports.map(report => <ReportTable key={report.path} report={report} />)}
                    </div>
                </>
            )}
        </main>
    )
}

export default StatisticsPage
