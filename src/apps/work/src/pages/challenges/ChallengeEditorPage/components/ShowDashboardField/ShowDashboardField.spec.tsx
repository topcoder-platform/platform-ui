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

import { ShowDashboardField } from './ShowDashboardField'

interface MockFormCheckboxFieldProps {
    label: string
    name: string
    onChange?: (checked: boolean) => void
}

jest.mock('../../../../../lib/components/form', () => ({
    FormCheckboxField: function MockFormCheckboxField(props: MockFormCheckboxFieldProps) {
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const formContext = reactHookForm.useFormContext()
        const controller = reactHookForm.useController({
            control: formContext.control,
            name: props.name,
        })

        function handleChange(event: { target: { checked: boolean } }): void {
            controller.field.onChange(event.target.checked)
            props.onChange?.(event.target.checked)
        }

        return (
            <input
                aria-label={props.label}
                checked={controller.field.value === true}
                name={props.name}
                onChange={handleChange}
                type='checkbox'
            />
        )
    },
}))

interface TestHarnessProps {
    defaultMetadata?: ChallengeMetadata[]
    funChallenge?: boolean
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
            funChallenge: props.funChallenge,
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
            <ShowDashboardField />
            <MetadataWatcher />
        </FormProvider>
    )
}

const SHOW_DASHBOARD_LABEL = 'Show Dashboard'
const SHOW_DATA_DASHBOARD_METADATA_FIELD = 'show_data_dashboard'

describe('ShowDashboardField', () => {
    it('leaves the dashboard disabled for standard marathon matches', async () => {
        render(<TestHarness funChallenge={false} />)

        await waitFor(() => {
            expect(screen.getByRole('checkbox', { name: SHOW_DASHBOARD_LABEL }))
                .not
                .toBeChecked()
        })
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe('[]')
    })

    it('defaults fun challenges to an enabled dashboard and persists the metadata', async () => {
        render(
            <TestHarness
                defaultMetadata={[{
                    name: 'existingMetadata',
                    value: 'keep-me',
                }]}
                funChallenge
            />,
        )

        await waitFor(() => {
            expect(screen.getByRole('checkbox', { name: SHOW_DASHBOARD_LABEL }))
                .toBeChecked()
        })
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify([
                {
                    name: 'existingMetadata',
                    value: 'keep-me',
                },
                {
                    name: SHOW_DATA_DASHBOARD_METADATA_FIELD,
                    value: 'true',
                },
            ]))
    })

    it('restores the saved value instead of the fun-challenge default', async () => {
        const metadata = [{
            name: SHOW_DATA_DASHBOARD_METADATA_FIELD,
            value: 'false',
        }]

        render(<TestHarness defaultMetadata={metadata} funChallenge />)

        await waitFor(() => {
            expect(screen.getByRole('checkbox', { name: SHOW_DASHBOARD_LABEL }))
                .not
                .toBeChecked()
        })
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify(metadata))
    })

    it('persists exact string booleans when the checkbox is toggled', async () => {
        const user = userEvent.setup()

        render(<TestHarness funChallenge={false} />)

        const showDashboardCheckbox = screen.getByRole('checkbox', { name: SHOW_DASHBOARD_LABEL })

        await user.click(showDashboardCheckbox)

        expect(showDashboardCheckbox)
            .toBeChecked()
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify([{
                name: SHOW_DATA_DASHBOARD_METADATA_FIELD,
                value: 'true',
            }]))

        await user.click(showDashboardCheckbox)

        expect(showDashboardCheckbox)
            .not
            .toBeChecked()
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify([{
                name: SHOW_DATA_DASHBOARD_METADATA_FIELD,
                value: 'false',
            }]))
    })
})
