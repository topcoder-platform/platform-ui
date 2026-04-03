/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { FC } from 'react'
import {
    render,
    screen,
} from '@testing-library/react'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'

import { ChallengeEditorFormData } from '../../../../../lib/models'

import { ChallengePrizesField } from './ChallengePrizesField'

jest.mock('../../../../../lib/components', () => ({
    ConfirmationModal: () => undefined,
}))

jest.mock('../../../../../lib/components/form', () => {
    const React = jest.requireActual('react')

    return {
        PrizeInput: function PrizeInput(props: {
            onChange: (value: number) => void
            value: number
        }) {
            const handleChange = React.useCallback((event: { target: { value: string } }): void => {
                props.onChange(Number.parseInt(event.target.value || '0', 10) || 0)
            }, [props])

            return (
                <input
                    aria-label='Prize amount'
                    onChange={handleChange}
                    type='text'
                    value={props.value > 0 ? String(props.value) : ''}
                />
            )
        },
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
    it('renders single-prize challenges with radio options and no redundant row label', () => {
        render(<TestHarness />)

        expect(screen.getByRole('radiogroup', { name: /Challenge Prizes/i }))
            .toBeTruthy()
        expect((screen.getByRole('radio', { name: 'USD' }) as HTMLInputElement).checked)
            .toBe(true)
        expect((screen.getByRole('radio', { name: 'Points' }) as HTMLInputElement).checked)
            .toBe(false)
        expect(screen.queryByText(/^Prize$/))
            .toBeNull()
    })

    it('keeps a single-row layout for multi-prize challenge types until a second prize is added', () => {
        render(<TestHarness challengeTypeName='Challenge' />)

        const onlyPrizeRow = screen.getByLabelText('Prize amount')
            .parentElement?.parentElement as HTMLDivElement

        expect(screen.queryByText('Prize 1'))
            .toBeNull()
        expect(onlyPrizeRow.childElementCount)
            .toBe(1)
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
        expect(screen.getAllByRole('button').length)
            .toBe(2)
    })
})
