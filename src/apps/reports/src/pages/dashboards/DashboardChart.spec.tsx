/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    render,
    screen,
    within,
} from '@testing-library/react'
import Highcharts from 'highcharts'

import {
    ChallengeParticipationDashboard,
    MemberPaymentByCustomerDashboard,
    NewSignupsDashboard,
} from '../../lib/services'

import { DashboardChart } from './DashboardChart'

let chartOptions: Highcharts.Options

jest.mock('highcharts-react-official', () => ({
    __esModule: true,
    default: (props: { options: Highcharts.Options }): JSX.Element => {
        chartOptions = props.options
        const series = props.options.series as Array<{
            data?: number[]
            name?: string
        }> || []

        return (
            <div
                data-series-data={JSON.stringify(series.map(item => item.data))}
                data-series-names={series.map(item => item.name)
                    .join('|')}
                data-testid='dashboard-chart'
            />
        )
    },
}))

const customerPaymentResponse: MemberPaymentByCustomerDashboard = {
    dashboard: 'member-payment-by-customer',
    endDate: '2026-03-01T00:00:00.000Z',
    months: [
        {
            month: '2026-01-01',
            values: {
                'customer-a': 125_000,
                'customer-b': 80_000,
                'other-customers': 20_000,
            },
        },
        {
            month: '2026-02-01',
            values: {
                'customer-a': 140_000,
                'customer-b': 0,
                'other-customers': 25_000,
            },
        },
    ],
    series: [
        {
            customerId: 'customer-id-a',
            key: 'customer-a',
            label: 'Customer A',
        },
        {
            customerId: 'customer-id-b',
            key: 'customer-b',
            label: 'Customer B',
        },
        {
            customerId: null, // eslint-disable-line unicorn/no-null
            key: 'other-customers',
            label: 'Other Customers',
        },
    ],
    startDate: '2026-01-01T00:00:00.000Z',
}

const signupResponse: NewSignupsDashboard = {
    dashboard: 'new-signups',
    endDate: '2026-02-01T00:00:00.000Z',
    months: [{
        activated: 90,
        month: '2026-01-01',
        notActivated: 10,
    }],
    startDate: '2026-01-01T00:00:00.000Z',
    summary: {
        activatedMembers: 90,
        activationRate: 90,
        notActivatedMembers: 10,
        peakMonth: '2026-01-01',
        peakMonthSignups: 100,
        totalSignups: 100,
    },
}

const challengeParticipationResponse: ChallengeParticipationDashboard = {
    dashboard: 'challenge-participation',
    endDate: '2026-02-01T00:00:00.000Z',
    months: [{
        month: '2026-01-01',
        registrants: 120,
        submitters: 75,
    }],
    startDate: '2026-01-01T00:00:00.000Z',
    summary: {
        peakMonth: '2026-01-01',
        peakMonthRegistrants: 120,
        submissionRate: 62.5,
        totalUniqueRegistrants: 120,
        totalUniqueSubmitters: 75,
    },
}
const pointValueToken = '{point.y:,.0f}'
const countTooltipValue = `<b>${pointValueToken}</b>`
const currencyTooltipValue = `<b>$${pointValueToken}</b>`

/**
 * Invokes the tooltip formatter captured from the rendered chart.
 *
 * Tests use this helper to verify totals independently of Highcharts' DOM renderer.
 *
 * @param values Hovered series values for one month.
 * @returns The formatter's tooltip HTML as one string.
 * @throws Error when the chart has no formatter or it returns no HTML.
 */
function formatTooltip(values: number[]): string {
    const formatter = chartOptions.tooltip?.formatter
    if (!formatter) {
        throw new Error('Tooltip formatter is missing')
    }

    const context = {
        points: values.map(y => ({ y })),
    } as unknown as Highcharts.TooltipFormatterContextObject
    const tooltip = {
        defaultFormatter: () => ['<strong>Jan ’26</strong><br/>', 'series rows'],
    } as unknown as Highcharts.Tooltip
    const result = formatter.call(context, tooltip)

    if (typeof result === 'string') {
        return result
    }

    if (Array.isArray(result)) {
        return result.join('')
    }

    throw new Error('Tooltip formatter did not return HTML')
}

describe('DashboardChart', () => {
    it('formats tooltip thousands with commas', () => {
        expect(Highcharts.getOptions().lang?.thousandsSep)
            .toBe(',')
        expect(Highcharts.numberFormat(9_189, 0))
            .toBe('9,189')
    })

    it('renders API-ordered customer series as currency data', () => {
        render(<DashboardChart response={customerPaymentResponse} />)

        const chart = screen.getByTestId('dashboard-chart')
        const table = screen.getByRole('table', {
            name: 'Member Payment $ by Customer monthly data',
        })

        expect(chart)
            .toHaveAttribute(
                'data-series-names',
                'Customer A|Customer B|Other Customers',
            )
        expect(chart)
            .toHaveAttribute(
                'data-series-data',
                '[[125000,140000],[80000,0],[20000,25000]]',
            )
        expect(chartOptions.tooltip?.pointFormat)
            .toContain(currencyTooltipValue)
        expect(formatTooltip([125_000, 80_000, 20_000]))
            .toContain('Total: <b>$225,000</b>')
        expect(within(table)
            .getByRole('columnheader', { name: 'Customer A' }))
            .toBeInTheDocument()
        expect(within(table)
            .getByRole('columnheader', { name: 'Other Customers' }))
            .toBeInTheDocument()
        expect(within(table)
            .getByRole('cell', { name: '$125,000' }))
            .toBeInTheDocument()
        expect(within(table)
            .getByRole('cell', { name: '$0' }))
            .toBeInTheDocument()
    })

    it('keeps count dashboard tooltips unit-free and adds their total', () => {
        render(<DashboardChart response={signupResponse} />)

        const table = screen.getByRole('table', {
            name: 'New Signups by Month monthly data',
        })

        expect(chartOptions.tooltip?.pointFormat)
            .toContain(countTooltipValue)
        expect(chartOptions.tooltip?.pointFormat)
            .not.toContain(currencyTooltipValue)
        expect(formatTooltip([90, 10]))
            .toContain('Total: <b>100</b>')
        expect(formatTooltip([90, 10]))
            .not.toContain('$100')
        expect(within(table)
            .getByRole('cell', { name: '90' }))
            .toBeInTheDocument()
    })

    it('adds a total to grouped report tooltips', () => {
        render(<DashboardChart response={challengeParticipationResponse} />)

        expect(formatTooltip([120, 75]))
            .toContain('Total: <b>195</b>')
    })
})
