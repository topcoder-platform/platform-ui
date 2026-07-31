import {
    dashboardDefinitions,
    getDashboardSeries,
} from './dashboard.config'

describe('dashboard chart definitions', () => {
    it('uses bottom-timeline column charts for every report', () => {
        expect(dashboardDefinitions['new-signups'].chartType)
            .toBe('column')
        expect(dashboardDefinitions['members-paid'].chartType)
            .toBe('column')
        expect(dashboardDefinitions['challenge-participation'].chartType)
            .toBe('column')
        expect(dashboardDefinitions['member-payment-by-month'].chartType)
            .toBe('column')
        expect(dashboardDefinitions['member-payment-by-customer'].chartType)
            .toBe('column')
    })

    it('keeps the signup and payment series stacked and participation grouped', () => {
        expect(dashboardDefinitions['new-signups'].stacked)
            .toBe(true)
        expect(dashboardDefinitions['members-paid'].stacked)
            .toBe(true)
        expect(dashboardDefinitions['challenge-participation'].stacked)
            .toBe(false)
        expect(dashboardDefinitions['member-payment-by-month'].stacked)
            .toBe(true)
        expect(dashboardDefinitions['member-payment-by-customer'].stacked)
            .toBe(true)
    })

    it('configures the payment value cards with their requested copy and currency mode', () => {
        expect(dashboardDefinitions['member-payment-by-month'])
            .toMatchObject({
                index: 4,
                subtitle: 'Split by Payment Types (TAAS, Task, Contest, Engagement)',
                title: 'Member Payment $ by Month',
                valueType: 'currency',
            })
        expect(dashboardDefinitions['member-payment-by-month'].series)
            .toEqual([
                expect.objectContaining({ key: 'taas', label: 'TAAS' }),
                expect.objectContaining({ key: 'task', label: 'Task' }),
                expect.objectContaining({ key: 'challenge', label: 'Contest' }),
                expect.objectContaining({ key: 'engagement', label: 'Engagement' }),
            ])
        expect(dashboardDefinitions['member-payment-by-customer'])
            .toMatchObject({
                index: 5,
                subtitle: 'Monthly payment value split by customer spending',
                title: 'Member Payment $ by Customer',
                valueType: 'currency',
            })
    })

    it('preserves dynamic customer order and assigns the Other Customers color', () => {
        const series = getDashboardSeries({
            dashboard: 'member-payment-by-customer',
            endDate: '2026-07-01T00:00:00.000Z',
            months: [],
            series: [
                {
                    customerId: '1',
                    key: 'customer-1',
                    label: 'Customer A',
                },
                {
                    customerId: '2',
                    key: 'customer-2',
                    label: 'Customer B',
                },
                {
                    customerId: null, // eslint-disable-line unicorn/no-null
                    key: 'other-customers',
                    label: 'Other Customers',
                },
            ],
            startDate: '2026-01-01T00:00:00.000Z',
        })

        expect(series.map(item => item.label))
            .toEqual([
                'Customer A',
                'Customer B',
                'Other Customers',
            ])
        expect(series.map(item => item.color))
            .toEqual([
                '#0f62fe',
                '#6aae3f',
                '#d7476f',
            ])
    })
})
