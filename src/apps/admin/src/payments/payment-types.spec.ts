import { WinningsTypeOptions } from './payment-types'

describe('payment type options', () => {
    it('exposes only PAYMENT for system-admin payment creation', () => {
        expect(WinningsTypeOptions)
            .toEqual([
                { label: 'Payment', value: 'PAYMENT' },
            ])
    })
})
