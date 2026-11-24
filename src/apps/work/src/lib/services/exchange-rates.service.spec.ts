import { fetchUsdToInrRate, resetUsdToInrRateCache } from './exchange-rates.service'

describe('fetchUsdToInrRate', () => {
    const originalFetch = global.fetch
    let mockFetch: jest.Mock

    const respond = (body: unknown, ok: boolean = true, status: number = 200): void => {
        mockFetch.mockResolvedValueOnce({
            json: () => Promise.resolve(body),
            ok,
            status,
        })
    }

    beforeEach(() => {
        resetUsdToInrRateCache()
        mockFetch = jest.fn()
        global.fetch = mockFetch as unknown as typeof fetch
    })

    afterAll(() => {
        global.fetch = originalFetch
    })

    it('reads the USD to INR rate from Frankfurter without sending credentials', async () => {
        respond([{ base: 'USD', date: '2026-11-24', quote: 'INR', rate: 92.73 }])

        await expect(fetchUsdToInrRate())
            .resolves
            .toEqual({ date: '2026-11-24', rate: 92.73 })
        expect(mockFetch)
            .toHaveBeenCalledWith(
                'https://api.frankfurter.dev/v2/rates?base=USD&quotes=INR',
                { credentials: 'omit' },
            )
    })

    it('asks only once per session', async () => {
        respond([{ date: '2026-11-24', quote: 'INR', rate: 92.73 }])

        await fetchUsdToInrRate()
        await fetchUsdToInrRate()

        expect(mockFetch)
            .toHaveBeenCalledTimes(1)
    })

    it('tries again after a failed request', async () => {
        respond({}, false, 503)
        respond([{ date: '2026-11-24', quote: 'INR', rate: 92.73 }])

        await expect(fetchUsdToInrRate())
            .rejects
            .toThrow('status 503')
        await expect(fetchUsdToInrRate())
            .resolves
            .toEqual({ date: '2026-11-24', rate: 92.73 })
    })

    it('rejects a response without a usable INR rate', async () => {
        respond([{ date: '2026-11-24', quote: 'EUR', rate: 0.95 }])

        await expect(fetchUsdToInrRate())
            .rejects
            .toThrow('did not include a USD to INR rate')
    })
})
