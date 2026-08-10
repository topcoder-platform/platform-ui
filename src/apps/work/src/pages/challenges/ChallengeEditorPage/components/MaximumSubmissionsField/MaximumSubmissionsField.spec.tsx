/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    ChangeEvent,
    FC,
} from 'react'
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    FormProvider,
    useForm,
    useWatch,
} from 'react-hook-form'

import { ChallengeEditorFormData } from '../../../../../lib/models'

import { MaximumSubmissionsField } from './MaximumSubmissionsField'

jest.mock('../../../../../lib/components/form', () => {
    const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')

    return {
        FormRadioGroup: (props: {
            label: string
            name: string
            onChange?: (value: boolean | string) => void
            options: Array<{
                label: string
                value: boolean | string
            }>
        }) => {
            const formContext: ReturnType<typeof reactHookForm.useFormContext> = reactHookForm.useFormContext()
            const controller: ReturnType<typeof reactHookForm.useController> = reactHookForm.useController({
                control: formContext.control,
                name: props.name,
            })
            const field = controller.field

            function handleChange(event: ChangeEvent<HTMLInputElement>): void {
                const selectedOption = props.options.find(option => (
                    String(option.value) === event.target.value
                ))

                if (!selectedOption) {
                    return
                }

                field.onChange(selectedOption.value)
                props.onChange?.(selectedOption.value)
            }

            return (
                <fieldset>
                    <legend>{props.label}</legend>
                    {props.options.map(option => (
                        <label key={String(option.value)}>
                            {option.label}
                            <input
                                checked={field.value === option.value}
                                name={field.name}
                                onBlur={field.onBlur}
                                onChange={handleChange}
                                type='radio'
                                value={String(option.value)}
                            />
                        </label>
                    ))}
                </fieldset>
            )
        },
        FormTextField: (props: {
            label: string
            min?: number
            name: string
            placeholder?: string
            sanitize?: (value: string) => string
            type?: 'number' | 'text'
        }) => {
            const formContext: ReturnType<typeof reactHookForm.useFormContext> = reactHookForm.useFormContext()
            const controller: ReturnType<typeof reactHookForm.useController> = reactHookForm.useController({
                control: formContext.control,
                name: props.name,
            })
            const field = controller.field

            function handleChange(event: ChangeEvent<HTMLInputElement>): void {
                const nextValue = props.sanitize
                    ? props.sanitize(event.target.value)
                    : event.target.value
                field.onChange(nextValue)
            }

            return (
                <label>
                    {props.label}
                    <input
                        min={props.min}
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={handleChange}
                        placeholder={props.placeholder}
                        type={props.type || 'text'}
                        value={typeof field.value === 'string'
                            ? field.value
                            : ''}
                    />
                </label>
            )
        },
    }
})

jest.mock('../../../../../lib/utils', () => ({
    getMetadataValue: (
        metadata: Array<{
            name: string
            value: string
        }> | undefined,
        name: string,
    ): string | undefined => metadata
        ?.find(entry => entry.name === name)
        ?.value,
    setMetadataValue: (
        metadata: Array<{
            name: string
            value: string
        }> | undefined,
        name: string,
        value: string,
    ): Array<{
        name: string
        value: string
    }> => {
        const metadataEntries = metadata || []
        const existingEntryIndex = metadataEntries.findIndex(entry => entry.name === name)

        return existingEntryIndex >= 0
            ? metadataEntries.map((entry, index) => (index === existingEntryIndex
                ? {
                    ...entry,
                    value,
                }
                : entry))
            : [
                ...metadataEntries,
                {
                    name,
                    value,
                },
            ]
    },
}))

interface TestHarnessProps {
    defaultMetadata?: Array<{
        name: string
        value: string
    }>
    deferDirty?: boolean
}

const MetadataWatcher: FC = () => {
    const metadata = useWatch<ChallengeEditorFormData>({
        name: 'metadata',
    })

    return <output data-testid='metadata-value'>{JSON.stringify(metadata || [])}</output>
}

const TestHarness: FC<TestHarnessProps> = (props: TestHarnessProps) => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            description: 'Public challenge specification',
            metadata: props.defaultMetadata,
            name: 'Design challenge',
            skills: [],
            tags: [],
            trackId: 'design-track',
            typeId: 'design-type',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <MaximumSubmissionsField deferDirty={props.deferDirty} />
            <output data-testid='dirty-value'>{String(formMethods.formState.isDirty)}</output>
            <MetadataWatcher />
        </FormProvider>
    )
}

describe('MaximumSubmissionsField', () => {
    it('defaults missing metadata to unlimited submissions', async () => {
        render(<TestHarness />)

        await waitFor(() => {
            expect((screen.getByRole('radio', { name: 'Unlimited' }) as HTMLInputElement).checked)
                .toBe(true)
        })
        expect((screen.getByRole('radio', { name: 'Limited' }) as HTMLInputElement).checked)
            .toBe(false)
        expect(screen.queryByRole('spinbutton', { name: 'Limit count' }))
            .toBeNull()

        await waitFor(() => {
            expect(screen.getByTestId('metadata-value').textContent)
                .toBe(JSON.stringify([{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '',
                        limit: 'false',
                        unlimited: 'true',
                    }),
                }]))
        })
    })

    it('restores an existing limited submission count', async () => {
        const limitedMetadata = [{
            name: 'submissionLimit',
            value: JSON.stringify({
                count: '3',
                limit: 'true',
                unlimited: 'false',
            }),
        }]

        render(<TestHarness defaultMetadata={limitedMetadata} />)

        await waitFor(() => {
            expect((screen.getByRole('radio', { name: 'Limited' }) as HTMLInputElement).checked)
                .toBe(true)
        })
        expect((screen.getByRole('spinbutton', { name: 'Limit count' }) as HTMLInputElement).value)
            .toBe('3')
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify(limitedMetadata))
    })

    it('persists a selected limit and count', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                defaultMetadata={[{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '',
                        limit: 'false',
                        unlimited: 'true',
                    }),
                }]}
            />,
        )

        await user.click(screen.getByRole('radio', { name: 'Limited' }))
        await user.type(screen.getByRole('spinbutton', { name: 'Limit count' }), '12')

        await waitFor(() => {
            expect(screen.getByTestId('metadata-value').textContent)
                .toBe(JSON.stringify([{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '12',
                        limit: 'true',
                        unlimited: 'false',
                    }),
                }]))
        })
    })

    it('clears the count when unlimited submissions are selected', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                defaultMetadata={[{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '2',
                        limit: 'true',
                        unlimited: 'false',
                    }),
                }]}
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('spinbutton', { name: 'Limit count' }) as HTMLInputElement).value)
                .toBe('2')
        })
        await user.click(screen.getByRole('radio', { name: 'Unlimited' }))

        expect(screen.queryByRole('spinbutton', { name: 'Limit count' }))
            .toBeNull()
        await waitFor(() => {
            expect(screen.getByTestId('metadata-value').textContent)
                .toBe(JSON.stringify([{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '',
                        limit: 'false',
                        unlimited: 'true',
                    }),
                }]))
        })
    })

    it('safely normalizes malformed metadata to unlimited', async () => {
        render(
            <TestHarness
                defaultMetadata={[{
                    name: 'submissionLimit',
                    value: '{invalid',
                }]}
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('radio', { name: 'Unlimited' }) as HTMLInputElement).checked)
                .toBe(true)
            expect(screen.getByTestId('metadata-value').textContent)
                .toBe(JSON.stringify([{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '',
                        limit: 'false',
                        unlimited: 'true',
                    }),
                }]))
        })
    })

    it('defers dirtying default metadata until resource hydration finishes', async () => {
        const rendered = render(<TestHarness deferDirty />)

        await waitFor(() => {
            expect(screen.getByTestId('metadata-value').textContent)
                .toBe(JSON.stringify([{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '',
                        limit: 'false',
                        unlimited: 'true',
                    }),
                }]))
        })
        expect(screen.getByTestId('dirty-value').textContent)
            .toBe('false')

        rendered.rerender(<TestHarness deferDirty={false} />)

        await waitFor(() => {
            expect(screen.getByTestId('dirty-value').textContent)
                .toBe('true')
        })
    })
})
