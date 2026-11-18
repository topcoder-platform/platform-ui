/* Each control captures its own selected value. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true }] */
import { FC, FormEvent, useState } from 'react'

import { Button, LoadingSpinner } from '~/libs/ui'

import {
    SalesCustomerPaymentFilters,
    SalesDashboardPeriod,
    SalesDashboardPortal,
} from './sales-dashboard.service'
import { salesFiscalYear } from './sales-fiscal-year'
import { SalesDashboardSource, useSalesDashboard } from './useSalesDashboard'
import SalesCustomerTable from './SalesCustomerTable'
import styles from './SalesDashboardsPage.module.scss'

const title = 'Goods Sold Customer-Wise'

/** Keeps goods-sold filters independent of the shared fiscal-year payment charts. */
const SalesGoodsSold: FC<{
    source: SalesDashboardSource; portal: SalesDashboardPortal; refreshKey: number; period: SalesDashboardPeriod
}> = props => {
    const fiscalYear = salesFiscalYear()
    const [startDate, setStartDate] = useState(`${fiscalYear - 1}-04-01`)
    const [endDate, setEndDate] = useState(`${fiscalYear}-03-31`)
    const [offeringType, setOfferingType] = useState<string[]>([])
    const [filters, setFilters] = useState<SalesCustomerPaymentFilters>()
    const [bookingCost, setBookingCost] = useState(false)
    const [validationError, setValidationError] = useState('')
    const filtered = useSalesDashboard(
        'payments',
        props.portal,
        'close',
        props.refreshKey,
        undefined,
        filters,
        !!filters,
    )
    const source = filters ? filtered : props.source
    const data = bookingCost ? source.data?.customerBookingCosts : source.data?.customerPayments
    const offerings = [...new Set([
        ...(props.source.data?.filterOptions?.offeringType ?? []),
        ...(source.data?.filterOptions?.offeringType ?? []),
        ...offeringType,
    ])].sort()
    const apply = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault()
        if (!startDate || !endDate || startDate > endDate) {
            setValidationError('From date must be on or before To date.')
            return
        }

        setValidationError('')
        setFilters({ endDate, offeringType, startDate })
    }

    const reset = (): void => {
        setStartDate(`${fiscalYear - 1}-04-01`)
        setEndDate(`${fiscalYear}-03-31`)
        setOfferingType([])
        setFilters(undefined)
        setValidationError('')
    }

    const controls = (
        <>
            <form onSubmit={apply} aria-label='Goods sold filters'>
                <div className={styles.filters}>
                    <label>
                        From date
                        <input
                            type='date'
                            required
                            value={startDate}
                            onChange={event => setStartDate(event.target.value)}
                        />
                    </label>
                    <label>
                        To date
                        <input
                            type='date'
                            required
                            value={endDate}
                            onChange={event => setEndDate(event.target.value)}
                        />
                    </label>
                </div>
                <fieldset className={styles.offeringFilters}>
                    <legend>Goods sold offering type</legend>
                    <label>
                        <input type='checkbox' checked={!offeringType.length} onChange={() => setOfferingType([])} />
                        ALL
                    </label>
                    {offerings.map(offering => (
                        <label key={offering}>
                            <input
                                type='checkbox'
                                checked={offeringType.includes(offering)}
                                onChange={event => setOfferingType(current => (event.target.checked
                                    ? [...current, offering] : current.filter(value => value !== offering)))}
                            />
                            {offering}
                        </label>
                    ))}
                </fieldset>
                {validationError && <p role='alert'>{validationError}</p>}
                <div className={styles.controls}>
                    <button className={styles.tableToggle} type='submit'>Apply filters</button>
                    <button className={styles.tableToggle} type='button' onClick={reset}>Reset filters</button>
                </div>
            </form>
            <div className={styles.controls} role='group' aria-label='Goods sold measure'>
                <Button secondary disabled={!bookingCost} onClick={() => setBookingCost(false)}>Member Payment</Button>
                <Button secondary disabled={bookingCost} onClick={() => setBookingCost(true)}>Booking Cost</Button>
            </div>
            <p>{bookingCost ? 'Booking Cost includes member payments and challenge fees.' : 'Member payments only.'}</p>
            {filters && (
                <p>
                    {`Applied dates: ${filters.startDate} through ${filters.endDate} (UTC, inclusive).`}
                    {` Offering types: ${filters.offeringType.join(', ') || 'ALL'}.`}
                </p>
            )}
        </>
    )

    return data ? (
        <SalesCustomerTable
            data={data}
            title={title}
            controls={controls}
            notices={source.data?.notices}
            period={props.period}
            totalLabel={filters ? 'Period total' : undefined}
            emptyMessage={filters ? 'No customer data matches these filters.' : undefined}
        />
    ) : (
        <article className={`${styles.card} ${styles.customerTable}`}>
            <h3>{title}</h3>
            {controls}
            {source.error ? (
                <div className={styles.error} role='alert'>
                    <p>{source.error}</p>
                    <Button secondary onClick={source.retry}>Try again</Button>
                </div>
            ) : source.data ? (
                <>
                    {source.data.notices.map(notice => <p key={notice} role='status'>{notice}</p>)}
                    <p>
                        {bookingCost ? 'Booking cost details are unavailable for this source.'
                            : 'Customer details are unavailable for this source.'}
                    </p>
                </>
            ) : <LoadingSpinner inline message={`Loading ${title}…`} />}
        </article>
    )
}

export default SalesGoodsSold
