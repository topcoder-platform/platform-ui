/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    FC,
} from 'react'
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
import { fetchGroupById } from '../../../../../lib/services'

import {
    resolveSubmissionType,
    SubmissionTypeField,
} from './SubmissionTypeField'

jest.mock('../../../../../lib/components/form', () => ({
    FormRadioGroup: (props: {
        label: string
        name: string
        onChange?: (value: string) => void
        options: Array<{
            label: string
            value: string
        }>
    }) => {
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const controller = reactHookForm.useController({
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
                        <label key={option.value}>
                            <input
                                checked={controller.field.value === option.value}
                                name={props.name}
                                onChange={handleOptionChange}
                                type='radio'
                                value={option.value}
                            />
                            {option.label}
                        </label>
                    )
                })}
            </fieldset>
        )
    },
}))

jest.mock('../../../../../lib/services', () => ({
    fetchGroupById: jest.fn(),
}))

interface TestHarnessProps {
    defaultGroups?: string[]
    defaultMetadata?: ChallengeMetadata[]
}

const FieldValueWatcher: FC = () => {
    const metadata = useWatch<ChallengeEditorFormData>({
        name: 'metadata',
    })
    const submissionType = useWatch<ChallengeEditorFormData>({
        name: 'submissionType',
    })

    return (
        <>
            <output data-testid='metadata-value'>{JSON.stringify(metadata || [])}</output>
            <output data-testid='submission-type-value'>{String(submissionType || '')}</output>
        </>
    )
}

const TestHarness: FC<TestHarnessProps> = (props: TestHarnessProps) => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            description: 'Public challenge specification',
            groups: props.defaultGroups || [],
            metadata: props.defaultMetadata,
            name: 'Challenge',
            skills: [],
            tags: [],
            trackId: 'development-track',
            typeId: 'challenge-type',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <SubmissionTypeField />
            <FieldValueWatcher />
        </FormProvider>
    )
}

const mockedFetchGroupById = fetchGroupById as jest.Mock

describe('resolveSubmissionType', () => {
    it('prefers explicit submission_type metadata over group defaults', () => {
        expect(resolveSubmissionType({
            groupIds: ['wipro-group-id'],
            groupsById: {
                'wipro-group-id': {
                    id: 'wipro-group-id',
                    name: 'Wipro - All',
                },
            },
            metadata: [{
                name: 'submission_type',
                value: 'zip',
            }],
        }))
            .toBe('zip')
    })
})

describe('SubmissionTypeField', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('defaults to URL when a selected group is a Wipro group', async () => {
        mockedFetchGroupById.mockResolvedValue({
            id: 'wipro-group-id',
            name: 'Wipro - All',
        })

        render(
            <TestHarness defaultGroups={['wipro-group-id']} />,
        )

        await waitFor(() => {
            expect(screen.getByRole('radio', { name: 'URL' }))
                .toBeChecked()
        })
        expect(screen.getByTestId('submission-type-value').textContent)
            .toBe('url')
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe('[]')
    })

    it('uses explicit zip metadata even when the group default would be URL', async () => {
        mockedFetchGroupById.mockResolvedValue({
            id: 'wipro-group-id',
            name: 'Wipro - All',
        })

        render(
            <TestHarness
                defaultGroups={['wipro-group-id']}
                defaultMetadata={[{
                    name: 'submission_type',
                    value: 'zip',
                }]}
            />,
        )

        await waitFor(() => {
            expect(screen.getByRole('radio', { name: 'Zip file' }))
                .toBeChecked()
        })
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify([{
                name: 'submission_type',
                value: 'zip',
            }]))
    })

    it('writes submission_type metadata when the selected radio changes', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness />,
        )

        await waitFor(() => {
            expect(screen.getByRole('radio', { name: 'Zip file' }))
                .toBeChecked()
        })

        await user.click(screen.getByRole('radio', { name: 'URL' }))

        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify([{
                name: 'submission_type',
                value: 'url',
            }]))
    })
})
