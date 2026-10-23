import { xhrGetAsync } from '~/libs/core'

import { fetchSalesDashboard, SalesDashboardPortal, SalesDashboardSection } from './sales-dashboard.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: { REPORTS_API: 'https://api.example/v6/reports' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({ xhrGetAsync: jest.fn() }), { virtual: true })

describe('Sales dashboard fiscal year requests', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-10-23T12:00:00Z'))
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it.each(['pipeline', 'revenue', 'payments', 'talent', 'gross-margin'] as SalesDashboardSection[])(
        'requests the full fiscal year for %s in both portals and date bases',
        section => {
            const signal = new AbortController().signal
            const response = Promise.resolve({ charts: [], notices: [] })
            const portals: SalesDashboardPortal[] = ['sales', 'reports']
            const dateBases = ['close', 'created'] as const
            jest.mocked(xhrGetAsync)
                .mockReturnValue(response)

            portals.forEach(portal => {
                dateBases.forEach(dateBasis => {
                    expect(fetchSalesDashboard(section, portal, dateBasis, signal))
                        .toBe(response)
                    const [url, , options] = jest.mocked(xhrGetAsync).mock.calls.slice(-1)[0]
                    const request = new URL(String(url))
                    expect(request.origin + request.pathname)
                        .toBe(`https://api.example/v6/reports/sales-dashboard/${section}`)
                    expect(Object.fromEntries(request.searchParams))
                        .toEqual({
                            dateBasis,
                            endDate: '2027-04-01T00:00:00.000Z',
                            portal,
                            startDate: '2026-04-01T00:00:00.000Z',
                        })
                    expect(options)
                        .toEqual({ signal, timeout: 120000 })
                })
            })
        },
    )

    it.each([
        ['2026-04-01T00:00:00Z', 2026],
        ['2026-12-31T23:59:59Z', 2026],
        ['2027-01-01T00:00:00Z', 2026],
        ['2027-03-31T23:59:59.999Z', 2026],
        ['2027-04-01T00:00:00Z', 2027],
        ['2028-02-29T12:00:00Z', 2027],
        ['2027-04-01T00:30:00+11:00', 2026],
        ['2027-03-31T23:30:00-07:00', 2027],
    ])('uses UTC time %s to select the fiscal year starting in April %s', (now, fiscalYear) => {
        jest.setSystemTime(new Date(now))
        fetchSalesDashboard('pipeline', 'sales', 'close', new AbortController().signal)
        const params = new URL(String(jest.mocked(xhrGetAsync).mock.calls[0][0])).searchParams
        expect(params.get('startDate'))
            .toBe(`${fiscalYear}-04-01T00:00:00.000Z`)
        expect(params.get('endDate'))
            .toBe(`${Number(fiscalYear) + 1}-04-01T00:00:00.000Z`)
    })

    it('rolls over to the next fiscal year on a subsequent request without reloading the app', () => {
        const signal = new AbortController().signal
        jest.setSystemTime(new Date('2027-03-31T23:59:59Z'))
        fetchSalesDashboard('payments', 'sales', 'close', signal)
        jest.setSystemTime(new Date('2027-04-01T00:00:00Z'))
        fetchSalesDashboard('payments', 'sales', 'close', signal)

        expect(jest.mocked(xhrGetAsync).mock.calls.map(([url]) => {
            const params = new URL(String(url)).searchParams
            return [params.get('startDate'), params.get('endDate')]
        }))
            .toEqual([
                ['2026-04-01T00:00:00.000Z', '2027-04-01T00:00:00.000Z'],
                ['2027-04-01T00:00:00.000Z', '2028-04-01T00:00:00.000Z'],
            ])
    })
})
