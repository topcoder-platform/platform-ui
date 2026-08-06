/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { FC } from 'react'
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import {
    FormProvider,
    useForm,
    useWatch,
} from 'react-hook-form'

import {
    ChallengeEditorFormData,
    ChallengeMetadata,
} from '../../../../../lib/models'

import { RegisteredMemberDownloadField } from './RegisteredMemberDownloadField'

interface MockFormRadioGroupProps {
    label: string
    name: string
    onChange?: (value: boolean | string) => void
    options: Array<{
        label: string
        value: boolean | string
    }>
}

jest.mock('../../../../../lib/components/form', () => ({
    FormRadioGroup: function MockFormRadioGroup(props: MockFormRadioGroupProps) {
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const formContext = reactHookForm.useFormContext()
        const controller = reactHookForm.useController({
            control: formContext.control,
            name: props.name,
        })

        return (
            <fieldset>
                <legend>{props.label}</legend>
                {props.options.map(option => {
                    function handleOptionChange(): void {
                        controller.field.onChange(option.value)
                        props.onChange?.(option.value)
                    }

                    return (
                        <label key={String(option.value)}>
                            <input
                                checked={controller.field.value === option.value}
                                name={props.name}
                                onChange={handleOptionChange}
                                type='radio'
                                value={String(option.value)}
                            />
                            {option.label}
                        </label>
                    )
                })}
            </fieldset>
        )
    },
}))

interface TestHarnessProps {
    defaultMetadata?: ChallengeMetadata[]
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
            name: 'Challenge',
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <RegisteredMemberDownloadField />
            <MetadataWatcher />
        </FormProvider>
    )
}

const SETTING_LABEL = 'Winning submissions download access:'
const SETTING_NAME = 'allowAllRegistrantsToDownloadWinningSubmissions'
const ALL_REGISTRANTS_LABEL = 'All challenge registrants - anyone who registered, whether or not they submitted'
const PASSING_SUBMITTERS_LABEL = 'Passing submitters only - members who submitted and passed review'

describe('RegisteredMemberDownloadField', () => {
    it('uses passing-submitter access when legacy metadata is absent', async () => {
        render(<TestHarness />)

        expect(screen.getByRole('group', { name: SETTING_LABEL }))
            .toBeInTheDocument()

        await waitFor(() => {
            expect(screen.getByRole('radio', { name: PASSING_SUBMITTERS_LABEL }))
                .toBeChecked()
        })
        expect(screen.getByRole('radio', { name: ALL_REGISTRANTS_LABEL }))
            .not.toBeChecked()
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe('[]')
    })

    it('persists exact string booleans while preserving unrelated metadata', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                defaultMetadata={[{
                    name: 'existingMetadata',
                    value: 'keep-me',
                }]}
            />,
        )

        const allRegistrantsOption = screen.getByRole('radio', { name: ALL_REGISTRANTS_LABEL })
        const passingSubmittersOption = screen.getByRole('radio', { name: PASSING_SUBMITTERS_LABEL })

        await user.click(allRegistrantsOption)

        expect(allRegistrantsOption)
            .toBeChecked()
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify([
                {
                    name: 'existingMetadata',
                    value: 'keep-me',
                },
                {
                    name: SETTING_NAME,
                    value: 'true',
                },
            ]))

        await user.click(passingSubmittersOption)

        expect(passingSubmittersOption)
            .toBeChecked()
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify([
                {
                    name: 'existingMetadata',
                    value: 'keep-me',
                },
                {
                    name: SETTING_NAME,
                    value: 'false',
                },
            ]))
    })

    it('restores all-registrant access from enabled metadata', async () => {
        const metadata = [
            {
                name: 'existingMetadata',
                value: 'keep-me',
            },
            {
                name: SETTING_NAME,
                value: 'true',
            },
        ]

        render(<TestHarness defaultMetadata={metadata} />)

        await waitFor(() => {
            expect(screen.getByRole('radio', { name: ALL_REGISTRANTS_LABEL }))
                .toBeChecked()
        })
        expect(screen.getByRole('radio', { name: PASSING_SUBMITTERS_LABEL }))
            .not.toBeChecked()
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify(metadata))
    })
})
