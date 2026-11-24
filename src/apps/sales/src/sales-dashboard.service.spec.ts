import { xhrGetAsync } from '~/libs/core'

import { fetchSalesDashboard, SalesDashboardPortal, SalesDashboardSection } from './sales-dashboard.service'

jest.mock('../../work/src/lib/constants', () => ({ ENGAGEMENTS_ROOT_API_URL: 'https://api.example/v6/engagements' }))

jest.mock('~/config', () => ({
    EnvironmentConfig: { REPORTS_API: 'https://api.example/v6/reports' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({ xhrGetAsync: jest.fn() }), { virtual: true })

const NO_LEADS = {
    Fulfilled: 0,
    Lost: 0,
    New: 0,
    'On Hold': 0,
    'Partially Fulfilled': 0,
    'Under Review': 0,
}

describe('Sales dashboard fiscal year requests', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-10-23T12:00:00Z'))
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('counts each lead in its UTC creation month across pages and stops at the fiscal-year boundary', async () => {
        const get = jest.mocked(xhrGetAsync)
        const signal = new AbortController().signal
        const lead = (id: string, status: string, createdAt: string): Record<string, string> => (
            { createdAt, id, status }
        )
        const overlap = lead('3', 'FULFILLED', '2026-10-01T00:01:00Z')
        get.mockResolvedValueOnce({
            data: [
                lead('1', 'SUBMITTED', '2026-10-20'),
                lead('8', 'ON_HOLD', '2026-10-08'),
                lead('9', 'PARTIALLY_FULFILLED', '2026-10-03'),
                lead('2', 'UNDER_REVIEW', '2026-10-02'),
                overlap,
            ],
            meta: { totalPages: 3 },
        })
            .mockResolvedValueOnce({
                data: [
                    overlap,
                    lead('4', 'REJECTED', '2026-10-01T00:01:00+01:00'),
                    lead('5', 'QUALIFIED', '2026-04-02'),
                    lead('6', 'CONVERTED', '2026-04-01T00:00:00Z'),
                    lead('7', 'SUBMITTED', '2026-03-31T23:59:59Z'),
                ],
                meta: { totalPages: 3 },
            })
        const result = await fetchSalesDashboard('leads', 'sales', 'close', signal)
        const chart = result.charts[0]
        expect(get.mock.calls.map(([url, , config]) => [String(url), config?.signal]))
            .toEqual([1, 2].map(page => [
                'https://api.example/v6/engagements/engagement-leads'
                + `?page=${page}&perPage=100&sortBy=createdAt&sortOrder=desc`,
                signal,
            ]))
        expect(chart.stacked)
            .toBe(true)
        expect(chart.series.map(series => series.label))
            .toEqual(['New', 'Under Review', 'Fulfilled', 'Partially Fulfilled', 'On Hold', 'Lost'])
        expect(chart.months)
            .toHaveLength(12)
        expect(chart.months[0])
            .toEqual({
                month: '2026-04-01',
                values: { ...NO_LEADS, 'Under Review': 2 },
            })
        expect(chart.months[5].values.Lost)
            .toBe(1)
        expect(chart.months[6].values)
            .toEqual({ Fulfilled: 1, Lost: 0, New: 1, 'On Hold': 1, 'Partially Fulfilled': 1, 'Under Review': 1 })
        expect(chart.months[11])
            .toEqual({ month: '2027-03-01', values: {} })
        expect(chart.annual)
            .toEqual({ Fulfilled: 1, Lost: 1, New: 1, 'On Hold': 1, 'Partially Fulfilled': 1, 'Under Review': 3 })
    })

    it('shows zero for every status in elapsed months when there are no leads', async () => {
        jest.mocked(xhrGetAsync)
            .mockResolvedValueOnce({ data: [], meta: { totalPages: 1 } })
        const result = await fetchSalesDashboard('leads', 'sales', 'close', new AbortController().signal)
        const chart = result.charts[0]
        const zeros = NO_LEADS
        expect(chart.annual)
            .toEqual(zeros)
        expect(chart.months[6].values)
            .toEqual(zeros)
        expect(chart.months[7].values)
            .toEqual({})
    })

    it('rejects an incomplete leads report when a later page fails', async () => {
        jest.mocked(xhrGetAsync)
            .mockResolvedValueOnce({
                data: [{ createdAt: '2026-10-20', id: '1', status: 'SUBMITTED' }],
                meta: { totalPages: 2 },
            })
            .mockRejectedValueOnce(new Error('offline'))
        await expect(fetchSalesDashboard('leads', 'sales', 'close', new AbortController().signal))
            .rejects.toThrow('offline')
    })

    it.each([
        'bookings', 'pipeline', 'revenue', 'revenue-forecast', 'payments', 'taas-payments', 'talent', 'gross-margin',
    ] as SalesDashboardSection[])(
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

    it.each([
        'offeringType', 'dealCategory', 'customerType', 'fyClosure',
    ] as const)('serializes the forecast breakdown %s without narrowing category values', groupBy => {
        fetchSalesDashboard('revenue-forecast', 'sales', 'close', new AbortController().signal, groupBy)
        const params = new URL(String(jest.mocked(xhrGetAsync).mock.calls[0][0])).searchParams
        expect(params.get('groupBy'))
            .toBe(groupBy)
        expect(params.has('offeringType'))
            .toBe(false)
        expect(params.has('customerType'))
            .toBe(false)
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

describe('Goods sold date and offering filters', () => {
    it.each([
        ['2028-02-29', '2028-03-01T00:00:00.000Z'],
        ['2026-12-31', '2027-01-01T00:00:00.000Z'],
    ])('includes the full To date %s in UTC', (endDate, exclusiveEnd) => {
        jest.clearAllMocks()
        const signal = new AbortController().signal
        fetchSalesDashboard('payments', 'sales', 'close', signal, undefined, {
            endDate,
            offeringType: ['AI Training', 'Flexible Talent'],
            startDate: '2026-05-15',
        })
        const params = new URL(String(jest.mocked(xhrGetAsync).mock.calls[0][0])).searchParams
        expect(params.get('startDate'))
            .toBe('2026-05-15T00:00:00.000Z')
        expect(params.get('endDate'))
            .toBe(exclusiveEnd)
        expect(params.getAll('offeringType'))
            .toEqual(['AI Training', 'Flexible Talent'])
        expect(params.get('portal'))
            .toBe('sales')
    })
})
