import { updateOptionalSinglePrizeSet } from './CopilotFeeField.utils'

describe('updateOptionalSinglePrizeSet', () => {
    it('removes the existing prize set when the next value is cleared', () => {
        expect(updateOptionalSinglePrizeSet([
            {
                prizes: [
                    {
                        type: 'USD',
                        value: 500,
                    },
                ],
                type: 'PLACEMENT',
            },
            {
                prizes: [
                    {
                        type: 'USD',
                        value: 50,
                    },
                ],
                type: 'COPILOT',
            },
        ], 'COPILOT', 'USD', 0))
            .toEqual([
                {
                    prizes: [
                        {
                            type: 'USD',
                            value: 500,
                        },
                    ],
                    type: 'PLACEMENT',
                },
            ])
    })

    it('adds the prize set when a positive value is provided', () => {
        expect(updateOptionalSinglePrizeSet([
            {
                prizes: [
                    {
                        type: 'USD',
                        value: 500,
                    },
                ],
                type: 'PLACEMENT',
            },
        ], 'COPILOT', 'USD', 75))
            .toEqual([
                {
                    prizes: [
                        {
                            type: 'USD',
                            value: 500,
                        },
                    ],
                    type: 'PLACEMENT',
                },
                {
                    prizes: [
                        {
                            type: 'USD',
                            value: 75,
                        },
                    ],
                    type: 'COPILOT',
                },
            ])
    })
})
