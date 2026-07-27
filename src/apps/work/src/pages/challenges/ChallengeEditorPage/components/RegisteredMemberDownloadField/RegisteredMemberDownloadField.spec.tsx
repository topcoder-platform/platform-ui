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

interface MockFormCheckboxFieldProps {
    checkboxOnlyHitArea?: boolean
    label: string
    name: string
    onChange?: (checked: boolean) => void
}

jest.mock('../../../../../lib/components/form', () => ({
    FormCheckboxField: function MockFormCheckboxField(props: MockFormCheckboxFieldProps) {
        const React: typeof import('react') = jest.requireActual('react')
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const formContext = reactHookForm.useFormContext()
        const controller = reactHookForm.useController({
            control: formContext.control,
            name: props.name,
        })

        return React.createElement(
            'label',
            {
                'data-checkbox-only-hit-area': props.checkboxOnlyHitArea === true
                    ? 'true'
                    : 'false',
            },
            React.createElement('input', {
                checked: controller.field.value === true,
                onChange: (event: { target: { checked: boolean } }) => {
                    controller.field.onChange(event.target.checked)
                    props.onChange?.(event.target.checked)
                },
                type: 'checkbox',
            }),
            props.label,
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

const SETTING_LABEL = 'Allow all registered members to download winning submissions after challenge ends'
const SETTING_NAME = 'allowAllRegistrantsToDownloadWinningSubmissions'

describe('RegisteredMemberDownloadField', () => {
    it('defaults to disabled when the metadata entry is absent', async () => {
        render(<TestHarness />)

        const checkbox = screen.getByRole('checkbox', { name: SETTING_LABEL })

        await waitFor(() => {
            expect(checkbox)
                .not.toBeChecked()
        })
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

        const checkbox = screen.getByRole('checkbox', { name: SETTING_LABEL })

        await user.click(checkbox)

        expect(checkbox)
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

        await user.click(checkbox)

        expect(checkbox)
            .not.toBeChecked()
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

    it('restores enabled metadata without changing the separate Design visibility gate', async () => {
        const metadata = [
            {
                name: 'submissionsViewable',
                value: 'false',
            },
            {
                name: SETTING_NAME,
                value: 'true',
            },
        ]

        render(<TestHarness defaultMetadata={metadata} />)

        await waitFor(() => {
            expect(screen.getByRole('checkbox', { name: SETTING_LABEL }))
                .toBeChecked()
        })
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify(metadata))
    })
})
