import { loadBillingDetails } from './billing-detail-requests'

describe('billing detail request queue', () => {
    it('paces concurrent challenge and finance batches through the same queue', async () => {
        const starts: number[] = []
        let active = 0
        let peak = 0
        const lookup = async (value: string): Promise<string> => {
            starts.push(Date.now())
            active += 1
            peak = Math.max(peak, active)
            await Promise.resolve()
            active -= 1
            return value
        }

        const [challenges, payments] = await Promise.all([
            loadBillingDetails(['challenge-1', 'challenge-2'], lookup),
            loadBillingDetails(['assignment-1'], lookup),
        ])
        expect(challenges)
            .toEqual(['challenge-1', 'challenge-2'])
        expect(payments)
            .toEqual(['assignment-1'])
        expect(peak)
            .toBe(1)
        expect(starts[1] - starts[0])
            .toBeGreaterThanOrEqual(450)
        expect(starts[2] - starts[1])
            .toBeGreaterThanOrEqual(450)
    })

    it('releases the queue after a failed request', async () => {
        await expect(loadBillingDetails(['missing'], async () => {
            throw new Error('Unavailable')
        })).rejects.toThrow('Unavailable')
        await expect(loadBillingDetails(['next'], async value => value)).resolves.toEqual(['next'])
    })
})
