/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import {
    useAutosave,
} from '../../../../lib/hooks'
import {
    autowriteDescription,
} from '../../../../lib/services'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../../lib/utils'

import { EngagementEditorForm } from './EngagementEditorForm'

jest.mock('../../../../lib/components/form', () => {
    const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')

    return {
        FormSelectField: function FormSelectField(props: {
            label: string
            name: string
            options?: Array<{ label: string; value: string }>
        }) {
            const controller = reactHookForm.useController({
                control: reactHookForm.useFormContext().control,
                name: props.name,
            })

            return (
                <label htmlFor={props.name}>
                    {props.label}
                    <select
                        id={props.name}
                        onBlur={controller.field.onBlur}
                        onChange={controller.field.onChange}
                        value={controller.field.value || ''}
                    >
                        {props.options?.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            )
        },
        FormTextField: function FormTextField(props: {
            label: string
            name: string
            type?: string
        }) {
            const controller = reactHookForm.useController({
                control: reactHookForm.useFormContext().control,
                name: props.name,
            })

            return (
                <label htmlFor={props.name}>
                    {props.label}
                    <input
                        id={props.name}
                        onBlur={controller.field.onBlur}
                        onChange={controller.field.onChange}
                        type={props.type || 'text'}
                        value={controller.field.value || ''}
                    />
                </label>
            )
        },
        FormTinyMceEditor: function FormTinyMceEditor(props: {
            label: string
            name: string
        }) {
            const controller = reactHookForm.useController({
                control: reactHookForm.useFormContext().control,
                name: props.name,
            })

            return (
                <label htmlFor={props.name}>
                    {props.label}
                    <textarea
                        id={props.name}
                        onBlur={controller.field.onBlur}
                        onChange={controller.field.onChange}
                        value={controller.field.value || ''}
                    />
                </label>
            )
        },
    }
})
jest.mock('../../../../lib/hooks', () => ({
    useAutosave: jest.fn(),
}))
jest.mock('../../../../lib/services', () => ({
    autowriteDescription: jest.fn(),
    createEngagement: jest.fn(),
    updateEngagement: jest.fn(),
}))
jest.mock('../../../../lib/utils', () => ({
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))
jest.mock('~/libs/ui', () => ({
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
        type?: 'button' | 'submit'
    }) => (
        <button
            disabled={props.disabled}
            onClick={props.onClick}
            type={props.type === 'submit'
                ? 'submit'
                : 'button'}
        >
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})
jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V5: 'https://example.com/v5',
            V6: 'https://example.com/v6',
        },
        CHALLENGE_API_URL: 'https://example.com/challenges',
        CHALLENGE_API_VERSION: 'v5',
        COMMUNITY_APP_URL: 'https://example.com/community',
        DIRECT_PROJECT_URL: 'https://example.com/direct-project',
        ENGAGEMENTS_URL: 'https://example.com/engagements',
        REVIEW_APP_URL: 'https://example.com/review',
        TC_DOMAIN: 'example.com',
        TC_FINANCE_API: 'https://example.com/finance',
        TOPCODER_URL: 'https://example.com/topcoder',
    },
}), {
    virtual: true,
})
jest.mock('./EngagementLocationFields', () => ({
    EngagementLocationFields: () => <></>,
}))
jest.mock('./EngagementPrivateSection', () => ({
    EngagementPrivateSection: () => <></>,
}))
jest.mock('./EngagementSkillsField', () => ({
    EngagementSkillsField: () => <></>,
}))
jest.mock('./EngagementStartDateField', () => ({
    EngagementStartDateField: () => <></>,
}))
jest.mock('./EngagementStatusField', () => ({
    EngagementStatusField: () => <></>,
}))

const mockedAutowriteDescription = autowriteDescription as jest.MockedFunction<typeof autowriteDescription>
const mockedShowErrorToast = showErrorToast as jest.MockedFunction<typeof showErrorToast>
const mockedShowSuccessToast = showSuccessToast as jest.MockedFunction<typeof showSuccessToast>
const mockedUseAutosave = useAutosave as jest.MockedFunction<typeof useAutosave>

describe('EngagementEditorForm', () => {
    beforeEach(() => {
        mockedUseAutosave.mockReturnValue({
            lastSaved: undefined,
            saveStatus: 'idle',
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('replaces the description with AI generated content', async () => {
        const user = userEvent.setup()

        mockedAutowriteDescription.mockResolvedValue('<p>Generated description</p>')

        render(
            <MemoryRouter>
                <EngagementEditorForm
                    engagement={{
                        anticipatedStart: 'Immediate',
                        countries: ['US'],
                        description: 'Original engagement description',
                        durationWeeks: 4,
                        id: 'engagement-1',
                        isPrivate: false,
                        role: 'SOFTWARE_DEVELOPER',
                        skills: [
                            {
                                id: 'skill-1',
                                name: 'React',
                            },
                        ],
                        status: 'Open',
                        timezones: ['America/New_York'],
                        title: 'AR Test',
                        workload: 'FULL_TIME',
                    } as any}
                    isEditMode
                    projectId='123'
                />
            </MemoryRouter>,
        )

        const descriptionField = screen.getByLabelText('Description') as HTMLTextAreaElement

        expect(descriptionField.value)
            .toBe('Original engagement description')

        await user.click(screen.getByRole('button', { name: 'AI Autowrite' }))

        await waitFor(() => {
            expect(mockedAutowriteDescription)
                .toHaveBeenCalledWith('Original engagement description')
        })

        await waitFor(() => {
            expect(descriptionField.value)
                .toBe('<p>Generated description</p>')
        })

        expect(mockedShowSuccessToast)
            .toHaveBeenCalledWith('AI generated description has been added.')
        expect(mockedShowErrorToast)
            .not
            .toHaveBeenCalled()
    })
})
