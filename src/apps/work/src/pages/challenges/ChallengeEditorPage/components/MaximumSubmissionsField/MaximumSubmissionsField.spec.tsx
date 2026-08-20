/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    FC,
    useCallback,
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
} from 'react-hook-form'

import {
    ChallengeEditorFormData,
    ChallengeMetadata,
} from '../../../../../lib/models'

import { MaximumSubmissionsField } from './MaximumSubmissionsField'

let mockStaleMetadata: ChallengeMetadata[] | undefined

jest.mock('react-hook-form', () => {
    const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')

    return {
        ...reactHookForm,
        useWatch: (props: { name?: string }): unknown => {
            const watchedValue = reactHookForm.useWatch(props as never)

            return props.name === 'metadata' && mockStaleMetadata
                ? mockStaleMetadata.map(metadataEntry => ({
                    ...metadataEntry,
                }))
                : watchedValue
        },
    }
})

interface TestHarnessProps {
    defaultMetadata?: Array<{
        name: string
        value: string
    }>
    deferDirty?: boolean
    numOfCheckpointSubmissions?: number
    numOfSubmissions?: number
    onMetadataWrite?: () => void
    staleSubmissionLimitMode?: string
}

const TestHarness: FC<TestHarnessProps> = (props: TestHarnessProps) => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            description: 'Public challenge specification',
            metadata: props.defaultMetadata,
            name: 'Design challenge',
            numOfCheckpointSubmissions: props.numOfCheckpointSubmissions,
            numOfSubmissions: props.numOfSubmissions,
            skills: [],
            tags: [],
            trackId: 'design-track',
            typeId: 'design-type',
            ...(props.staleSubmissionLimitMode
                ? { submissionLimitCount: '', submissionLimitMode: props.staleSubmissionLimitMode }
                : {}),
        } as ChallengeEditorFormData,
    })
    const resetToPersistedValues = useCallback(() => {
        // Mirrors the editor resetting the form from saved challenge data, which drops the
        // display-only submission-limit fields.
        formMethods.reset({
            description: 'Public challenge specification',
            metadata: props.defaultMetadata,
            name: 'Design challenge',
            skills: [],
            tags: [],
            trackId: 'design-track',
            typeId: 'design-type',
        } as ChallengeEditorFormData)
    }, [formMethods, props.defaultMetadata])
    const setValue = useCallback<typeof formMethods.setValue>((
        name,
        value,
        options,
    ) => {
        if (name === 'metadata') {
            props.onMetadataWrite?.()
        }

        formMethods.setValue(name, value as never, options)
    }, [
        formMethods,
        props.onMetadataWrite,
    ])
    const values = formMethods.watch()

    return (
        <FormProvider
            {...formMethods}
            setValue={setValue}
        >
            <MaximumSubmissionsField deferDirty={props.deferDirty} />
            <button onClick={resetToPersistedValues} type='button'>Reset form</button>
            <output data-testid='dirty-value'>{String(formMethods.formState.isDirty)}</output>
            <output data-testid='metadata-value'>{JSON.stringify(values.metadata || [])}</output>
        </FormProvider>
    )
}

describe('MaximumSubmissionsField', () => {
    afterEach(() => {
        mockStaleMetadata = undefined
    })

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

    it('writes metadata once when the watched metadata lags during resource hydration', async () => {
        const user = userEvent.setup()
        const onMetadataWrite = jest.fn()
        const defaultMetadata = [{
            name: 'submissionLimit',
            value: JSON.stringify({
                count: '',
                limit: 'false',
                unlimited: 'true',
            }),
        }]
        mockStaleMetadata = defaultMetadata

        const rendered = render(
            <TestHarness
                defaultMetadata={defaultMetadata}
                deferDirty
                onMetadataWrite={onMetadataWrite}
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('radio', { name: 'Unlimited' }) as HTMLInputElement).checked)
                .toBe(true)
        })
        await user.click(screen.getByRole('radio', { name: 'Limited' }))

        expect(await screen.findByRole('spinbutton', { name: 'Limit count' }))
            .toBeTruthy()
        await waitFor(() => {
            expect(screen.getByTestId('metadata-value').textContent)
                .toBe(JSON.stringify([{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '',
                        limit: 'true',
                        unlimited: 'false',
                    }),
                }]))
            expect(screen.getByTestId('dirty-value').textContent)
                .toBe('true')
        })
        expect(onMetadataWrite)
            .toHaveBeenCalledTimes(1)

        rendered.rerender(
            <TestHarness
                defaultMetadata={defaultMetadata}
                deferDirty={false}
                onMetadataWrite={onMetadataWrite}
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('radio', { name: 'Limited' }) as HTMLInputElement).checked)
                .toBe(true)
            expect(screen.getByTestId('metadata-value').textContent)
                .toBe(JSON.stringify([{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '',
                        limit: 'true',
                        unlimited: 'false',
                    }),
                }]))
        })
        expect(onMetadataWrite)
            .toHaveBeenCalledTimes(1)
    })

    it('persists a selected limit and count', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                defaultMetadata={[
                    {
                        name: 'otherMetadata',
                        value: 'preserved',
                    },
                    {
                        name: 'submissionLimit',
                        value: JSON.stringify({
                            count: '',
                            limit: 'false',
                            unlimited: 'true',
                        }),
                    },
                ]}
            />,
        )

        await user.click(screen.getByRole('radio', { name: 'Limited' }))
        await user.type(screen.getByRole('spinbutton', { name: 'Limit count' }), '12')

        await waitFor(() => {
            expect(screen.getByTestId('metadata-value').textContent)
                .toBe(JSON.stringify([
                    {
                        name: 'otherMetadata',
                        value: 'preserved',
                    },
                    {
                        name: 'submissionLimit',
                        value: JSON.stringify({
                            count: '12',
                            limit: 'true',
                            unlimited: 'false',
                        }),
                    },
                ]))
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
        const onMetadataWrite = jest.fn()
        const rendered = render(
            <TestHarness
                deferDirty
                onMetadataWrite={onMetadataWrite}
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('radio', { name: 'Unlimited' }) as HTMLInputElement).checked)
                .toBe(true)
            expect(screen.getByTestId('metadata-value').textContent)
                .toBe(JSON.stringify([]))
        })
        expect(screen.getByTestId('dirty-value').textContent)
            .toBe('false')
        expect(onMetadataWrite)
            .not
            .toHaveBeenCalled()

        rendered.rerender(
            <TestHarness
                deferDirty={false}
                onMetadataWrite={onMetadataWrite}
            />,
        )

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
            expect(screen.getByTestId('dirty-value').textContent)
                .toBe('true')
        })
        expect(onMetadataWrite)
            .toHaveBeenCalledTimes(1)
    })
    it('restores the persisted limit when the editor resets the form', async () => {
        const user = userEvent.setup()
        const limitedMetadata = [{
            name: 'submissionLimit',
            value: JSON.stringify({
                count: '2',
                limit: 'true',
                unlimited: 'false',
            }),
        }]

        render(<TestHarness defaultMetadata={limitedMetadata} />)

        await waitFor(() => {
            expect((screen.getByRole('radio', { name: 'Limited' }) as HTMLInputElement).checked)
                .toBe(true)
        })
        await user.click(screen.getByRole('button', { name: 'Reset form' }))

        await waitFor(() => {
            expect((screen.getByRole('radio', { name: 'Limited' }) as HTMLInputElement).checked)
                .toBe(true)
            expect((screen.getByRole('spinbutton', { name: 'Limit count' }) as HTMLInputElement).value)
                .toBe('2')
        })
    })

    it('replaces a stale selection with the persisted submission limit', async () => {
        render(
            <TestHarness
                defaultMetadata={[{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '3',
                        limit: 'true',
                        unlimited: 'false',
                    }),
                }]}
                staleSubmissionLimitMode='unlimited'
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('radio', { name: 'Limited' }) as HTMLInputElement).checked)
                .toBe(true)
            expect((screen.getByRole('spinbutton', { name: 'Limit count' }) as HTMLInputElement).value)
                .toBe('3')
        })
        expect((screen.getByRole('radio', { name: 'Unlimited' }) as HTMLInputElement).checked)
            .toBe(false)
    })

    it('locks the submission limit once a submission has been uploaded', async () => {
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
                numOfSubmissions={1}
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('radio', { name: 'Limited' }) as HTMLInputElement).checked)
                .toBe(true)
        })
        expect((screen.getByRole('radio', { name: 'Unlimited' }) as HTMLInputElement).disabled)
            .toBe(true)
        expect((screen.getByRole('radio', { name: 'Limited' }) as HTMLInputElement).disabled)
            .toBe(true)
        expect((screen.getByRole('spinbutton', { name: 'Limit count' }) as HTMLInputElement).disabled)
            .toBe(true)
        expect(screen.getByText(
            'The submission limit cannot be changed after the first submission is uploaded.',
        ))
            .toBeTruthy()
    })

    it('locks the submission limit once a checkpoint submission has been uploaded', async () => {
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
                numOfCheckpointSubmissions={2}
                numOfSubmissions={0}
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('radio', { name: 'Unlimited' }) as HTMLInputElement).checked)
                .toBe(true)
        })
        expect((screen.getByRole('radio', { name: 'Limited' }) as HTMLInputElement).disabled)
            .toBe(true)
        expect(screen.getByText(
            'The submission limit cannot be changed after the first submission is uploaded.',
        ))
            .toBeTruthy()
    })

    it('keeps the submission limit editable while no submission exists', async () => {
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
                numOfCheckpointSubmissions={0}
                numOfSubmissions={0}
            />,
        )

        await waitFor(() => {
            expect((screen.getByRole('radio', { name: 'Unlimited' }) as HTMLInputElement).checked)
                .toBe(true)
        })
        expect((screen.getByRole('radio', { name: 'Limited' }) as HTMLInputElement).disabled)
            .toBe(false)
        expect(screen.queryByText(
            'The submission limit cannot be changed after the first submission is uploaded.',
        ))
            .toBeNull()

        await user.click(screen.getByRole('radio', { name: 'Limited' }))

        expect(await screen.findByRole('spinbutton', { name: 'Limit count' }))
            .toBeTruthy()
    })
})
