/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    render,
    screen,
    within,
} from '@testing-library/react'

import {
    MemberPaymentByCustomerDashboard,
    NewSignupsDashboard,
} from '../../lib/services'

import { DashboardChart } from './DashboardChart'

jest.mock('highcharts-react-official', () => ({
    __esModule: true,
    default: (props: {
        options: {
            series?: Array<{ data?: number[]; name?: string }>
            tooltip?: { pointFormat?: string }
        }
    }): JSX.Element => {
        const series = props.options.series || []

        return (
            <div
                data-series-data={JSON.stringify(series.map(item => item.data))}
                data-series-names={series.map(item => item.name)
                    .join('|')}
                data-testid='dashboard-chart'
                data-tooltip={props.options.tooltip?.pointFormat}
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

const pointValueToken = '{point.y:,.0f}'
const countTooltipValue = `<b>${pointValueToken}</b>`
const currencyTooltipValue = `<b>$${pointValueToken}</b>`

describe('DashboardChart', () => {
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
        expect(chart.getAttribute('data-tooltip'))
            .toContain(currencyTooltipValue)
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

    it('keeps existing count dashboards unit-free', () => {
        render(<DashboardChart response={signupResponse} />)

        const chart = screen.getByTestId('dashboard-chart')
        const table = screen.getByRole('table', {
            name: 'New Signups by Month monthly data',
        })

        expect(chart.getAttribute('data-tooltip'))
            .toContain(countTooltipValue)
        expect(chart.getAttribute('data-tooltip'))
            .not.toContain(currencyTooltipValue)
        expect(within(table)
            .getByRole('cell', { name: '90' }))
            .toBeInTheDocument()
    })
})
