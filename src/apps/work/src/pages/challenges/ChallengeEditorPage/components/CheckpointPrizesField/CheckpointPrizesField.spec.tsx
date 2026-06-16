/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    FC,
    useCallback,
} from 'react'
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    FormProvider,
    useForm,
    useFormContext,
    useWatch,
} from 'react-hook-form'

import {
    ChallengeEditorFormData,
    PrizeSet,
} from '../../../../../lib/models'

import { CheckpointPrizesField } from './CheckpointPrizesField'

jest.mock('../../../../../lib/components/form', () => {
    const React = jest.requireActual('react')
    const HookForm = jest.requireActual('react-hook-form')

    return {
        FormFieldWrapper: (props: { children: React.ReactNode }) => (
            <div>{props.children}</div>
        ),
        FormSelectField: function FormSelectField(props: {
            fromFieldValue?: (
                value: unknown,
                options: Array<{ label: string, value: string }>,
            ) => { label: string, value: string } | undefined
            name: string
            options?: Array<{ label: string, value: string }>
            toFieldValue?: (selected: { label: string, value: string } | undefined) => unknown
        }) {
            const formContext: { control: unknown } = HookForm.useFormContext()
            const controller: {
                field: {
                    onChange: (value: unknown) => void
                    value: unknown
                }
            } = HookForm.useController({
                control: formContext.control,
                name: props.name,
            })
            const field = controller.field
            const options = props.options || []
            const selectedOption = props.fromFieldValue
                ? props.fromFieldValue(field.value, options)
                : undefined

            const handleChange = React.useCallback((event: { target: { value: string } }): void => {
                const nextOption = options.find(option => option.value === event.target.value)
                const nextValue = props.toFieldValue
                    ? props.toFieldValue(nextOption)
                    : nextOption?.value

                field.onChange(nextValue)
            }, [
                field,
                options,
                props,
            ])

            return (
                <select
                    aria-label='Checkpoint prize count'
                    onChange={handleChange}
                    value={selectedOption?.value || ''}
                >
                    {options.map(option => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
            )
        },
        PrizeInput: function PrizeInput(props: {
            onChange: (value: number) => void
            value: number
        }) {
            const handleChange = React.useCallback((event: { target: { value: string } }): void => {
                props.onChange(Number.parseInt(event.target.value || '0', 10) || 0)
            }, [props])

            return (
                <input
                    aria-label='Checkpoint prize amount'
                    onChange={handleChange}
                    type='text'
                    value={props.value > 0 ? String(props.value) : ''}
                />
            )
        },
    }
})

jest.mock('../../../../../lib/utils', () => ({
    getPrizeType: (
        prizeSets: Array<{ prizes?: Array<{ type: string }>, type: string }>,
    ) => prizeSets
        .find(prizeSet => prizeSet.type === 'PLACEMENT')
        ?.prizes?.[0]?.type || 'USD',
}))

interface TestHarnessProps {
    defaultPrizeSets: PrizeSet[]
}

const SeedPlacementPrizesButton: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const setValue = formContext.setValue
    const handleClick = useCallback((): void => {
        setValue('prizeSets.0.prizes' as never, [
            {
                type: 'USD',
                value: 1000,
            },
            {
                type: 'USD',
                value: 500,
            },
        ] as never, {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [setValue])

    return (
        <button
            onClick={handleClick}
            type='button'
        >
            Seed placement prizes
        </button>
    )
}

const WatchedPrizeSets: FC = () => {
    const prizeSets = useWatch<ChallengeEditorFormData>({
        name: 'prizeSets',
    })

    return (
        <output data-testid='prize-sets'>{JSON.stringify(prizeSets || [])}</output>
    )
}

const TestHarness: FC<TestHarnessProps> = props => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            description: 'Public specification',
            name: 'Checkpoint prizes test',
            prizeSets: props.defaultPrizeSets,
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <SeedPlacementPrizesButton />
            <CheckpointPrizesField name='prizeSets' />
            <WatchedPrizeSets />
        </FormProvider>
    )
}

describe('CheckpointPrizesField', () => {
    it('preserves nested placement prize edits when changing the checkpoint amount', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                defaultPrizeSets={[
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
                        prizes: Array.from({
                            length: 5,
                        }, () => ({
                            type: 'USD',
                            value: 50,
                        })),
                        type: 'CHECKPOINT',
                    },
                ]}
            />,
        )

        await user.click(screen.getByRole('button', {
            name: 'Seed placement prizes',
        }))
        fireEvent.change(screen.getByRole('textbox', {
            name: 'Checkpoint prize amount',
        }), {
            target: {
                value: '1',
            },
        })

        expect(screen.getByTestId('prize-sets').textContent)
            .toBe(JSON.stringify([
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
                {
                    prizes: Array.from({
                        length: 5,
                    }, () => ({
                        type: 'USD',
                        value: 1,
                    })),
                    type: 'CHECKPOINT',
                },
            ]))
    })

    it('preserves nested placement prize edits when changing the checkpoint count', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                defaultPrizeSets={[
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
                        prizes: Array.from({
                            length: 5,
                        }, () => ({
                            type: 'USD',
                            value: 25,
                        })),
                        type: 'CHECKPOINT',
                    },
                ]}
            />,
        )

        await user.click(screen.getByRole('button', {
            name: 'Seed placement prizes',
        }))
        await user.selectOptions(screen.getByRole('combobox', {
            name: 'Checkpoint prize count',
        }), '3')

        expect(screen.getByTestId('prize-sets').textContent)
            .toBe(JSON.stringify([
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
                {
                    prizes: Array.from({
                        length: 3,
                    }, () => ({
                        type: 'USD',
                        value: 25,
                    })),
                    type: 'CHECKPOINT',
                },
            ]))
    })
})
