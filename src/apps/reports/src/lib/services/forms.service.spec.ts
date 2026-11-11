/* eslint-disable ordered-imports/ordered-imports, unicorn/no-null */
import { xhrGetAsync } from '~/libs/core'
import {
    downloadFormSubmissions,
    fetchFormSubmissions,
    fetchReportForms,
    fetchSpaceTechSubmissions,
    formatFormValue,
} from './forms.service'

const mockGet = jest.fn()
jest.mock('~/config', () => ({ EnvironmentConfig: { API: { V6: 'https://api.test/v6' } } }), { virtual: true })
jest.mock('~/libs/core', () => ({
    xhrCreateInstance: () => ({ get: (...args: unknown[]) => mockGet(...args) }),
    xhrGetAsync: jest.fn(),
}), { virtual: true })

describe('Forms reporting service', () => {
    beforeEach(() => jest.clearAllMocks())

    it('follows directory cursors and preserves date filters on a submission page', async () => {
        (xhrGetAsync as jest.Mock).mockResolvedValueOnce({ data: [{ key: 'a', title: 'A' }], nextCursor: 'a' })
            .mockResolvedValueOnce({ data: [{ key: 'b', title: 'B' }], nextCursor: null })
        expect(await fetchReportForms())
            .toHaveLength(2)
        expect(xhrGetAsync)
            .toHaveBeenLastCalledWith('https://api.test/v6/forms/reports/directory?after=a', expect.anything())
        await fetchFormSubmissions('lets_talk', { endDate: '2026-09-30', startDate: '2026-09-01' }, 'cursor')
        expect(xhrGetAsync)
            .toHaveBeenLastCalledWith(
                'https://api.test/v6/forms/lets_talk/submissions?startDate=2026-09-01'
                + '&endDate=2026-09-30&limit=25&after=cursor',
                expect.anything(),
            )
    })

    it('exports without pagination and keeps false, zero, and choices visible', async () => {
        mockGet.mockResolvedValue({ data: new Blob(['csv']) })
        await downloadFormSubmissions('lets_talk', { endDate: '2026-09-30' })
        expect(mockGet)
            .toHaveBeenCalledWith(
                'https://api.test/v6/forms/lets_talk/submissions/export?endDate=2026-09-30',
                { headers: { Accept: 'text/csv' }, responseType: 'blob' },
            )
        expect(formatFormValue(false))
            .toBe('false')
        expect(formatFormValue(0))
            .toBe('0')
        expect(formatFormValue(['a', 'b']))
            .toBe('a, b')
    })
})

describe('SpaceTech report pagination', () => {
    beforeEach(() => jest.clearAllMocks())

    it('loads later pages before sorting/filtering and preserves the date range', async () => {
        (xhrGetAsync as jest.Mock).mockResolvedValueOnce({ data: [{ submission_id: 'a' }], nextCursor: 'a' })
            .mockResolvedValueOnce({ data: [{ submission_id: 'b' }], nextCursor: null })
        const result = await fetchSpaceTechSubmissions({ startDate: '2026-09-01' }, () => true)
        expect(result.data.map(row => row.submission_id))
            .toEqual(['a', 'b'])
        expect(result.total)
            .toBe(2)
        expect(result.nextCursor)
            .toBeNull()
        expect(xhrGetAsync)
            .toHaveBeenLastCalledWith(
                'https://api.test/v6/forms/space_tech_challenge/submissions?startDate=2026-09-01&limit=25&after=a',
                expect.anything(),
            )
    })

    it('stops pagination for an obsolete selection and rejects repeated cursors', async () => {
        (xhrGetAsync as jest.Mock).mockResolvedValue({ data: [], nextCursor: 'same' })
        await fetchSpaceTechSubmissions({}, () => false)
        expect(xhrGetAsync)
            .toHaveBeenCalledTimes(1)
        await expect(fetchSpaceTechSubmissions({}, () => true)).rejects.toThrow('Invalid submissions cursor')
    })
})
