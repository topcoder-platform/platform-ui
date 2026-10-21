import { xhrGetAsync } from '~/libs/core'

import { fetchSalesReport } from './sales.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: { REPORTS_API: 'https://api.example/v6/reports' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({ xhrGetAsync: jest.fn() }), { virtual: true })

describe('Sales report filters request', () => {
    it('serializes OR values as repeated parameters and keeps commas inside each value', () => {
        const signal = new AbortController().signal
        fetchSalesReport({
            amountColumn: 'AMOUNT',
            amountMax: 100000.5,
            amountMin: 0,
            drilldownColumn: 'STAGE',
            drilldownValue: ['Proposal', 'Contracts'],
            filterColumn: 'NAME',
            filterValue: ['Acme, Inc.', 'Other & Co'],
            page: 1,
            perPage: 25,
        }, signal)
        const [url, , options] = jest.mocked(xhrGetAsync).mock.calls[0]
        const params = new URL(String(url)).searchParams
        expect(params.getAll('filterValue'))
            .toEqual(['Acme, Inc.', 'Other & Co'])
        expect(params.getAll('drilldownValue'))
            .toEqual(['Proposal', 'Contracts'])
        expect(params.get('amountMin'))
            .toBe('0')
        expect(params.get('amountMax'))
            .toBe('100000.5')
        expect(options)
            .toMatchObject({ signal })
    })
})
