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

import { ChallengeEditorFormData } from '../../../../../lib/models'

import { RateChallengeField } from './RateChallengeField'

jest.mock('../../../../../lib/components/form', () => ({
    FormCheckboxField: function MockFormCheckboxField(props: {
        label: string
        name: string
        onChange?: (checked: boolean) => void
    }) {
        const React: typeof import('react') = jest.requireActual('react')
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const formContext = reactHookForm.useFormContext()
        const controller = reactHookForm.useController({
            control: formContext.control,
            name: props.name,
        })

        return React.createElement(
            'label',
            {},
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
    defaultMetadata?: Array<{
        name: string
        value: unknown
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
            name: 'Development challenge',
            skills: [],
            tags: [],
            trackId: 'development-track',
            typeId: 'development-type',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <RateChallengeField />
            <MetadataWatcher />
        </FormProvider>
    )
}

describe('RateChallengeField', () => {
    it('defaults to rated when metadata is missing and stores false when unchecked', async () => {
        const user = userEvent.setup()

        render(<TestHarness />)

        const checkbox = screen.getByRole('checkbox', { name: 'Rate this challenge' })
        await waitFor(() => {
            expect(checkbox)
                .toBeChecked()
        })

        await user.click(checkbox)

        expect(checkbox)
            .not.toBeChecked()
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify([{
                name: 'isRated',
                value: 'false',
            }]))
    })

    it('restores the default rated metadata when checked again', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                defaultMetadata={[{
                    name: 'isRated',
                    value: 'false',
                }]}
            />,
        )

        const checkbox = screen.getByRole('checkbox', { name: 'Rate this challenge' })
        await waitFor(() => {
            expect(checkbox)
                .not.toBeChecked()
        })

        await user.click(checkbox)

        expect(checkbox)
            .toBeChecked()
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify([]))
    })
})
