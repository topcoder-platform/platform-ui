/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { FC } from 'react'
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'

import { ChallengeEditorFormData } from '../../../../../lib/models'

import { ChallengePrizesField } from './ChallengePrizesField'
import styles from './ChallengePrizesField.module.scss'

jest.mock('../../../../../lib/components', () => ({
    ConfirmationModal: () => undefined,
}))

jest.mock('../../../../../lib/components/form', () => {
    const actualPrizeInput = jest.requireActual('../../../../../lib/components/form/PrizeInput')

    return {
        PrizeInput: actualPrizeInput.PrizeInput,
    }
})

jest.mock('../../../../../lib/utils', () => ({
    applyPrizeTypeToPrizeSets: (
        prizeSets: Array<{ prizes?: Array<{ type: string, value: number }>, type: string }>,
        nextPrizeType: string,
    ) => prizeSets.map(prizeSet => ({
        ...prizeSet,
        prizes: (prizeSet.prizes || []).map(prize => ({
            ...prize,
            type: nextPrizeType,
        })),
    })),
    getPrizeType: (
        prizeSets: Array<{ prizes?: Array<{ type: string }> }>,
    ) => prizeSets[0]?.prizes?.[0]?.type || 'USD',
    validatePrizeValue: (value: string): string => {
        const digitsOnly = value.replace(/[^\d]/g, '')

        if (!digitsOnly) {
            return ''
        }

        const parsedValue = Number.parseInt(digitsOnly, 10)

        if (Number.isNaN(parsedValue)) {
            return ''
        }

        return String(Math.min(parsedValue, 1000000))
    },
}))

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        className?: string
        disabled?: boolean
        label: string
        onClick?: () => void
    }) => (
        <button
            className={props.className}
            disabled={props.disabled}
            onClick={props.onClick}
            type='button'
        >
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})

interface TestHarnessProps {
    challengeTypeName?: string
    defaultPrizeSets?: ChallengeEditorFormData['prizeSets']
}

const TestHarness: FC<TestHarnessProps> = props => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            description: 'Public specification',
            name: 'Challenge prizes test',
            prizeSets: props.defaultPrizeSets || [
                {
                    prizes: [
                        {
                            type: 'USD',
                            value: 500,
                        },
                    ],
                    type: 'PLACEMENT',
                },
            ],
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <ChallengePrizesField
                challengeTypeName={props.challengeTypeName}
                name='prizeSets'
            />
        </FormProvider>
    )
}

describe('ChallengePrizesField', () => {
    it('renders single-prize challenges with radio options and a numbered prize row label', () => {
        render(<TestHarness />)

        expect(screen.getByRole('radiogroup', { name: /Challenge Prizes/i }))
            .toBeTruthy()
        expect((screen.getByRole('radio', { name: 'USD' }) as HTMLInputElement).checked)
            .toBe(true)
        expect((screen.getByRole('radio', { name: 'Points' }) as HTMLInputElement).checked)
            .toBe(false)
        expect(screen.getByText('Prize 1'))
            .toBeTruthy()
    })

    it('keeps a labeled first prize row before a second prize is added', () => {
        render(<TestHarness challengeTypeName='Challenge' />)

        const onlyPrizeRow = screen.getByRole('textbox')
            .parentElement?.parentElement?.parentElement as HTMLDivElement
        const header = screen.getByRole('radiogroup', { name: /Challenge Prizes/i })
            .parentElement as HTMLDivElement

        expect(screen.getByText('Prize 1'))
            .toBeTruthy()
        expect(onlyPrizeRow.childElementCount)
            .toBe(2)
        expect(header.className)
            .toContain(styles.fieldHeaderWithPrizeLabels)
        expect(screen.getByRole('button', { name: '+ Add New Prize' }))
            .toBeTruthy()
    })

    it('does not reserve a blank delete column on the first row in multi-prize mode', () => {
        render(
            <TestHarness
                challengeTypeName='First2Finish'
                defaultPrizeSets={[
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 1000,
                            },
                            {
                                type: 'USD',
                                value: 500,
                            },
                        ],
                        type: 'PLACEMENT',
                    },
                ]}
            />,
        )

        const firstPrizeRow = screen.getByText('Prize 1')
            .parentElement as HTMLDivElement
        const secondPrizeRow = screen.getByText('Prize 2')
            .parentElement as HTMLDivElement

        expect(firstPrizeRow.childElementCount)
            .toBe(2)
        expect(secondPrizeRow.childElementCount)
            .toBe(3)
        expect(secondPrizeRow.className)
            .toContain(styles.prizeRowWithRemove)
        expect(screen.getAllByRole('button').length)
            .toBe(2)
    })

    it('keeps the first row free of a blank delete column after adding another prize', () => {
        render(<TestHarness challengeTypeName='Challenge' />)

        fireEvent.click(screen.getByRole('button', { name: '+ Add New Prize' }))

        const firstPrizeRow = screen.getByText('Prize 1')
            .parentElement as HTMLDivElement
        const secondPrizeRow = screen.getByText('Prize 2')
            .parentElement as HTMLDivElement

        expect(firstPrizeRow.childElementCount)
            .toBe(2)
        expect(secondPrizeRow.childElementCount)
            .toBe(3)
        expect(secondPrizeRow.className)
            .toContain(styles.prizeRowWithRemove)
    })

    it('allows typing multiple digits into an empty prize input continuously', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                defaultPrizeSets={[
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 0,
                            },
                        ],
                        type: 'PLACEMENT',
                    },
                ]}
            />,
        )

        const prizeInput = screen.getByRole('textbox') as HTMLInputElement

        await user.type(prizeInput, '55')

        expect(prizeInput.value)
            .toBe('55')
        expect(document.activeElement)
            .toBe(prizeInput)
    })

    it('allows equal lower placement prizes without showing an ordering error', () => {
        render(
            <TestHarness
                challengeTypeName='Challenge'
                defaultPrizeSets={[
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 100,
                            },
                            {
                                type: 'USD',
                                value: 50,
                            },
                            {
                                type: 'USD',
                                value: 20,
                            },
                            {
                                type: 'USD',
                                value: 20,
                            },
                        ],
                        type: 'PLACEMENT',
                    },
                ]}
            />,
        )

        expect(screen.queryByText('Each subsequent prize must be less than or equal to the one above it.'))
            .toBeNull()
    })

    it('shows an ordering error when a lower placement prize increases', () => {
        render(
            <TestHarness
                challengeTypeName='Challenge'
                defaultPrizeSets={[
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 100,
                            },
                            {
                                type: 'USD',
                                value: 50,
                            },
                            {
                                type: 'USD',
                                value: 60,
                            },
                        ],
                        type: 'PLACEMENT',
                    },
                ]}
            />,
        )

        expect(screen.getByText('Each subsequent prize must be less than or equal to the one above it.'))
            .toBeTruthy()
    })
})
