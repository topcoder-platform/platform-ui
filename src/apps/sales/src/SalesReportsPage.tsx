/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, KeyboardEvent, useState } from 'react'

import SalesPipelinePage from './SalesPage'
import SalesProgressionPage from './SalesProgressionPage'
import styles from './SalesProgressionPage.module.scss'
import './sales.scss'

/**
 * Selects the current pipeline or historical progression report on all Sales hosts.
 * @returns Accessible report tabs and the active report; inactive requests are cancelled on unmount.
 * @throws Does not throw.
 */
const SalesReportsPage: FC = () => {
    const [tab, setTab] = useState('pipeline')

    /** @param event Tab keyboard event. @returns Nothing; selects and focuses the adjacent tab. Does not throw. */
    function changeTab(event: KeyboardEvent<HTMLButtonElement>): void {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 'pipeline'
            : event.key === 'End' ? 'progression' : tab === 'pipeline' ? 'progression' : 'pipeline'
        setTab(next)
        document.getElementById(`sales-tab-${next}`)
            ?.focus()
    }

    const navigation = (
        <div className={styles.tabs} role='tablist' aria-label='Sales reports'>
            {['pipeline', 'progression'].map(value => (
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
                    {value === 'pipeline' ? 'Pipeline' : 'Stage progression'}
                </button>
            ))}
        </div>
    )

    return (
        <div className='sales-app'>
            <div className={styles.navigation}>{navigation}</div>
            <div id='sales-report-panel' role='tabpanel' aria-labelledby={`sales-tab-${tab}`}>
                {tab === 'pipeline' ? <SalesPipelinePage /> : <SalesProgressionPage />}
            </div>
        </div>
    )
}

export default SalesReportsPage
