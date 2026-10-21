/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, KeyboardEvent, useState } from 'react'

import SalesDashboardsPage from './SalesDashboardsPage'
import SalesPipelinePage from './SalesPage'
import SalesProgressionPage from './SalesProgressionPage'
import styles from './SalesProgressionPage.module.scss'
import './sales.scss'

/**
 * Selects the pipeline, historical progression or monthly dashboards on all Sales hosts.
 * @returns Accessible report tabs and the active report; inactive requests are cancelled on unmount.
 * @throws Does not throw.
 */
const SalesReportsPage: FC = () => {
    const [tab, setTab] = useState('pipeline')
    const tabs = ['pipeline', 'progression', 'dashboards']

    /** @param event Tab keyboard event. @returns Nothing; selects and focuses the adjacent tab. Does not throw. */
    function changeTab(event: KeyboardEvent<HTMLButtonElement>): void {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const index = tabs.indexOf(tab)
        const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1]
            : tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
        setTab(next)
        document.getElementById(`sales-tab-${next}`)
            ?.focus()
    }

    const navigation = (
        <div className={styles.tabs} role='tablist' aria-label='Sales reports'>
            {tabs.map(value => (
                <button
                    key={value}
                    id={`sales-tab-${value}`}
                    type='button'
                    role='tab'
                    aria-selected={tab === value}
                    aria-controls='sales-report-panel'
                    tabIndex={tab === value ? 0 : -1}
                    onClick={() => setTab(value)}
                    onKeyDown={changeTab}
                >
                    {value === 'pipeline' ? 'Pipeline'
                        : value === 'progression' ? 'Stage progression' : 'Monthly dashboards'}
                </button>
            ))}
        </div>
    )

    return (
        <div className='sales-app'>
            <div className={styles.navigation}>{navigation}</div>
            <div id='sales-report-panel' role='tabpanel' aria-labelledby={`sales-tab-${tab}`}>
                {tab === 'pipeline' ? <SalesPipelinePage /> : tab === 'progression' ? <SalesProgressionPage />
                    : <SalesDashboardsPage portal='sales' />}
            </div>
        </div>
    )
}

export default SalesReportsPage
