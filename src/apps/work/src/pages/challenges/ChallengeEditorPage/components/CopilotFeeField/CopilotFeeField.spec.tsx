/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    FC,
    useCallback,
} from 'react'
import {
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

import { CopilotFeeField } from './CopilotFeeField'

jest.mock('../../../../../lib/components/form', () => {
    const React = jest.requireActual('react')

    return {
        FormFieldWrapper: (props: { children: React.ReactNode }) => (
            <div>{props.children}</div>
        ),
        PrizeInput: function PrizeInput(props: {
            onChange: (value: number) => void
            value: number
        }) {
            const handleChange = React.useCallback((event: { target: { value: string } }): void => {
                props.onChange(Number.parseInt(event.target.value || '0', 10) || 0)
            }, [props])

            return (
                <input
                    onChange={handleChange}
                    type='text'
                    value={props.value > 0 ? String(props.value) : ''}
                />
            )
        },
    }
})

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
            name: 'Copilot fee test',
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
            <CopilotFeeField name='prizeSets' />
            <WatchedPrizeSets />
        </FormProvider>
    )
}

describe('CopilotFeeField', () => {
    it('preserves nested placement prize edits when adding a copilot fee', async () => {
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
                ]}
            />,
        )

        await user.click(screen.getByRole('button', {
            name: 'Seed placement prizes',
        }))
        await user.type(screen.getByRole('textbox'), '50')

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
                    prizes: [
                        {
                            type: 'USD',
                            value: 50,
                        },
                    ],
                    type: 'COPILOT',
                },
            ]))
    })
})
