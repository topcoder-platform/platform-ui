import { FC, KeyboardEvent, useCallback, useMemo, useState } from 'react'
import useSWR, { SWRResponse } from 'swr'
import 'flag-icons/css/flag-icons.min.css'

import { IconOutline } from '~/libs/ui'

import {
    fetchGeneralStatistics,
    fetchWinnersByCountry,
    GeneralStatistics,
    StatisticsCountry,
} from '../../../lib'

import {
    IconFirstPlace,
    IconSecondPlace,
    IconThirdPlace,
} from './assets'
import WorldMap from './WorldMap'
import styles from './StatisticsPage.module.scss'

type StatisticsTab = 'countries' | 'winners'

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')

function formatPrizeTotal(value?: number): string {
    if (value === undefined) {
        return '—'
    }

    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`
    }

    return `$${NUMBER_FORMATTER.format(value)}`
}

function formatCount(value?: number): string {
    return value === undefined ? '—' : NUMBER_FORMATTER.format(value)
}

const StatisticsPage: FC = () => {
    const [activeTab, setActiveTab] = useState<StatisticsTab>('countries')
    const {
        data: generalStatistics,
        error: generalStatisticsError,
        mutate: reloadGeneralStatistics,
    }: SWRResponse<GeneralStatistics, Error> = useSWR(
        'customer-portal-general-statistics',
        fetchGeneralStatistics,
    )
    const {
        data: winners,
        error: winnersError,
        mutate: reloadWinners,
    }: SWRResponse<StatisticsCountry[], Error> = useSWR(
        activeTab === 'winners' ? 'customer-portal-winners-by-country' : undefined,
        fetchWinnersByCountry,
    )

    const countries: StatisticsCountry[] = useMemo(
        () => (
            activeTab === 'countries'
                ? generalStatistics?.countries || []
                : winners || []
        ),
        [activeTab, generalStatistics?.countries, winners],
    )
    const isLoading = activeTab === 'countries'
        ? !generalStatistics && !generalStatisticsError
        : !winners && !winnersError
    const contentError = activeTab === 'countries' ? generalStatisticsError : winnersError
    const valueLabel = activeTab === 'countries' ? 'Members' : 'First-place wins'

    const selectTab = useCallback((tab: StatisticsTab) => {
        setActiveTab(tab)
    }, [])

    const handleTabKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            return
        }

        event.preventDefault()
        setActiveTab(current => (current === 'countries' ? 'winners' : 'countries'))
    }, [])

    const reloadContent = useCallback(() => {
        if (activeTab === 'countries') {
            reloadGeneralStatistics()

            return
        }

        reloadWinners()
    }, [activeTab, reloadGeneralStatistics, reloadWinners])

    const reloadAllStatistics = useCallback(() => {
        reloadGeneralStatistics()
    }, [reloadGeneralStatistics])
    const selectCountriesTab = useCallback(() => {
        selectTab('countries')
    }, [selectTab])
    const selectWinnersTab = useCallback(() => {
        selectTab('winners')
    }, [selectTab])

    const kpis = [{
        icon: <IconOutline.UserGroupIcon aria-hidden='true' />,
        label: 'Total Members',
        value: formatCount(generalStatistics?.memberCount),
    }, {
        icon: <IconOutline.CurrencyDollarIcon aria-hidden='true' />,
        label: 'Total Prizes',
        value: formatPrizeTotal(generalStatistics?.totalPrizes),
    }, {
        icon: <IconOutline.BadgeCheckIcon aria-hidden='true' />,
        label: 'Challenges Completed',
        value: formatCount(generalStatistics?.completedChallenges),
    }, {
        icon: <IconOutline.GlobeAltIcon aria-hidden='true' />,
        label: 'Countries Represented',
        value: formatCount(generalStatistics?.countries.length),
    }]

    return (
        <main className={styles.page}>
            <section className={styles.kpis} aria-label='General statistics'>
                {kpis.map(kpi => (
                    <article className={styles.kpiCard} key={kpi.label}>
                        <div>
                            <p>{kpi.label}</p>
                            <strong>{kpi.value}</strong>
                        </div>
                        <span className={styles.kpiIcon}>{kpi.icon}</span>
                    </article>
                ))}
            </section>

            {generalStatisticsError && (
                <div className={styles.kpiError} role='alert'>
                    Statistics could not be loaded.
                    <button type='button' onClick={reloadAllStatistics}>
                        Try again
                    </button>
                </div>
            )}

            <section className={styles.distribution}>
                <h1>Global Talent Distribution</h1>
                <p className={styles.subtitle}>Overview of Country Representatives and Winners</p>

                <div className={styles.tabs} role='tablist' aria-label='Country statistic'>
                    <button
                        aria-controls='country-statistics-panel'
                        aria-selected={activeTab === 'countries'}
                        className={activeTab === 'countries' ? styles.activeTab : ''}
                        id='countries-tab'
                        onClick={selectCountriesTab}
                        onKeyDown={handleTabKeyDown}
                        role='tab'
                        tabIndex={activeTab === 'countries' ? 0 : -1}
                        type='button'
                    >
                        Countries Represented
                    </button>
                    <button
                        aria-controls='country-statistics-panel'
                        aria-selected={activeTab === 'winners'}
                        className={activeTab === 'winners' ? styles.activeTab : ''}
                        id='winners-tab'
                        onClick={selectWinnersTab}
                        onKeyDown={handleTabKeyDown}
                        role='tab'
                        tabIndex={activeTab === 'winners' ? 0 : -1}
                        type='button'
                    >
                        Winners by Country
                    </button>
                </div>

                <div
                    aria-labelledby={`${activeTab}-tab`}
                    className={styles.content}
                    id='country-statistics-panel'
                    role='tabpanel'
                >
                    {isLoading && <div className={styles.status}>Loading country statistics…</div>}
                    {contentError && (
                        <div className={styles.status} role='alert'>
                            Country statistics could not be loaded.
                            <button type='button' onClick={reloadContent}>Try again</button>
                        </div>
                    )}
                    {!isLoading && !contentError && (
                        <>
                            <div className={styles.tableWrapper}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Country</th>
                                            <th>{`# of ${valueLabel}`}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {countries.map((country, index) => {
                                            const rankIcon = index === 0
                                                ? <IconFirstPlace aria-hidden='true' />
                                                : index === 1
                                                    ? <IconSecondPlace aria-hidden='true' />
                                                    : index === 2
                                                        ? <IconThirdPlace aria-hidden='true' />
                                                        : <>{index + 1}</>

                                            return (
                                                <tr key={country.code || country.name}>
                                                    <td>
                                                        <span className={styles[`rank${Math.min(index + 1, 4)}`]}>
                                                            {rankIcon ?? index + 1}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            {country.code && (
                                                                <span
                                                                    aria-hidden='true'
                                                                    className={`
                                                                        ${styles.flag}
                                                                        fi fi-${country.code.toLowerCase()}
                                                                    `}
                                                                />
                                                            )}
                                                            <span>{country.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>{NUMBER_FORMATTER.format(country.count)}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <WorldMap
                                countries={countries}
                                showWinnerDetails={activeTab === 'winners'}
                                valueLabel={valueLabel}
                            />
                        </>
                    )}
                </div>
            </section>
        </main>
    )
}

export default StatisticsPage
