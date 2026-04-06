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
        FormCheckboxField: (props: {
            label: string
            name: string
            onChange?: (checked: boolean) => void
        }) => {
            const formContext: ReturnType<typeof reactHookForm.useFormContext> = reactHookForm.useFormContext()
            const controller: ReturnType<typeof reactHookForm.useController> = reactHookForm.useController({
                control: formContext.control,
                name: props.name,
            })
            const field = controller.field

            function handleChange(event: ChangeEvent<HTMLInputElement>): void {
                field.onChange(event.target.checked)
                props.onChange?.(event.target.checked)
            }

            return (
                <label>
                    {props.label}
                    <input
                        checked={field.value === true}
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={handleChange}
                        type='checkbox'
                    />
                </label>
            )
        },
        FormTextField: (props: {
            label: string
            name: string
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
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={handleChange}
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
            <MaximumSubmissionsField />
            <MetadataWatcher />
        </FormProvider>
    )
}

describe('MaximumSubmissionsField', () => {
    it('does not render the unlimited option while editing', () => {
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

        expect(screen.queryByRole('checkbox', { name: 'Unlimited' }))
            .toBeNull()
        expect(screen.getByRole('checkbox', { name: 'Limit' }))
            .toBeTruthy()
    })

    it('clears the legacy unlimited flag when a submission cap is enabled', async () => {
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

        await user.click(screen.getByRole('checkbox', { name: 'Limit' }))

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
        })
    })
})
