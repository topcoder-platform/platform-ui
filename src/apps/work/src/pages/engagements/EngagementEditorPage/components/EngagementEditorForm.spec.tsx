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
    createEngagement,
    updateEngagement,
} from '../../../../lib/services'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../../lib/utils'

import { EngagementEditorForm } from './EngagementEditorForm'

const mockNavigate = jest.fn()

jest.mock('@hookform/resolvers/yup', () => ({
    yupResolver: () => async (values: unknown) => ({
        errors: {},
        values,
    }),
}))

jest.mock('react-router-dom', () => {
    const reactRouterDom: typeof import('react-router-dom') = jest.requireActual('react-router-dom')

    return {
        ...reactRouterDom,
        useNavigate: () => mockNavigate,
    }
})

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
    AppSubdomain: {
        work: 'work',
    },
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
        SUBDOMAIN: 'platform',
        TC_DOMAIN: 'example.com',
        TC_FINANCE_API: 'https://example.com/finance',
        TOPCODER_URL: 'https://example.com/topcoder',
    },
}), {
    virtual: true,
})
jest.mock('./EngagementLocationFields', () => ({
    EngagementLocationFields: function EngagementLocationFields() {
        const React: typeof import('react') = jest.requireActual('react')
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const setValue = reactHookForm.useFormContext().setValue

        React.useEffect(() => {
            setValue('countries', ['US'])
            setValue('timezones', ['America/New_York'])
        }, [setValue])

        return <></>
    },
}))
jest.mock('./EngagementPrivateSection', () => ({
    EngagementPrivateSection: () => <></>,
}))
jest.mock('./EngagementSkillsField', () => ({
    EngagementSkillsField: function EngagementSkillsField() {
        const React: typeof import('react') = jest.requireActual('react')
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const setValue = reactHookForm.useFormContext().setValue

        React.useEffect(() => {
            setValue('skills', [{
                id: 'skill-1',
                name: 'React',
            }])
        }, [setValue])

        return <></>
    },
}))
jest.mock('./EngagementStartDateField', () => ({
    EngagementStartDateField: () => <></>,
}))
jest.mock('./EngagementStatusField', () => ({
    EngagementStatusField: () => <></>,
}))

const mockedAutowriteDescription = autowriteDescription as jest.MockedFunction<typeof autowriteDescription>
const mockedCreateEngagement = createEngagement as jest.MockedFunction<typeof createEngagement>
const mockedShowErrorToast = showErrorToast as jest.MockedFunction<typeof showErrorToast>
const mockedShowSuccessToast = showSuccessToast as jest.MockedFunction<typeof showSuccessToast>
const mockedUpdateEngagement = updateEngagement as jest.MockedFunction<typeof updateEngagement>
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

        mockedAutowriteDescription.mockResolvedValue('## Generated description')

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
            .toContain('Original engagement description')

        await user.click(screen.getByRole('button', { name: 'AI Autowrite' }))

        await waitFor(() => {
            expect(mockedAutowriteDescription)
                .toHaveBeenCalledWith('Original engagement description')
        })

        await waitFor(() => {
            expect(descriptionField.value)
                .toContain('<h2>Generated description</h2>')
        })

        expect(mockedShowSuccessToast)
            .toHaveBeenCalledWith('AI generated description has been added.')
        expect(mockedShowErrorToast)
            .not
            .toHaveBeenCalled()
    })

    it('shows Software Developer for the software developer role option', () => {
        render(
            <MemoryRouter>
                <EngagementEditorForm
                    isEditMode={false}
                    projectId='123'
                />
            </MemoryRouter>,
        )

        const roleField = screen.getByLabelText('Role') as HTMLSelectElement
        const softwareDeveloperOption = Array.from(roleField.options)
            .find(option => option.value === 'SOFTWARE_DEVELOPER')

        expect(softwareDeveloperOption?.text)
            .toBe('Software Developer')
    })

    it('redirects to the project engagements list after creating an engagement', async () => {
        const user = userEvent.setup()

        mockedCreateEngagement.mockResolvedValue({
            anticipatedStart: 'Immediate',
            assignedMemberHandles: [],
            assignments: [],
            compensationRange: '',
            countries: ['US'],
            createdAt: '',
            description: 'Created engagement description',
            durationWeeks: 4,
            id: 'engagement-2',
            isPrivate: false,
            projectId: '123',
            requiredMemberCount: 1,
            role: 'SOFTWARE_DEVELOPER',
            skills: [
                {
                    id: 'skill-1',
                    name: 'React',
                },
            ],
            status: 'Open',
            timezones: ['America/New_York'],
            title: 'Created engagement',
            updatedAt: '',
            workload: 'FULL_TIME',
        } as any)

        render(
            <MemoryRouter>
                <EngagementEditorForm
                    isEditMode={false}
                    projectId='123'
                />
            </MemoryRouter>,
        )

        await user.type(screen.getByLabelText('Title'), 'Created engagement')
        await user.type(screen.getByLabelText('Duration in weeks'), '4')
        await user.type(screen.getByLabelText('Description'), 'Created engagement description')
        await user.click(screen.getByRole('button', { name: 'Save Engagement' }))

        await waitFor(() => {
            expect(mockedCreateEngagement)
                .toHaveBeenCalled()
        })

        expect(mockedShowSuccessToast)
            .toHaveBeenCalledWith('Engagement created successfully')

        expect(mockNavigate)
            .toHaveBeenCalledWith('/work/projects/123/engagements')
    })

    it('redirects to the project engagements list after editing an engagement', async () => {
        const user = userEvent.setup()

        mockedUpdateEngagement.mockResolvedValue({
            anticipatedStart: 'Immediate',
            assignedMemberHandles: [],
            assignments: [],
            compensationRange: '',
            countries: ['US'],
            createdAt: '',
            description: 'Updated engagement description',
            durationWeeks: 4,
            id: 'engagement-1',
            isPrivate: false,
            projectId: '123',
            requiredMemberCount: 1,
            role: 'SOFTWARE_DEVELOPER',
            skills: [
                {
                    id: 'skill-1',
                    name: 'React',
                },
            ],
            status: 'Open',
            timezones: ['America/New_York'],
            title: 'Updated engagement',
            updatedAt: '',
            workload: 'FULL_TIME',
        } as any)

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
                        projectId: '123',
                        role: 'SOFTWARE_DEVELOPER',
                        skills: [
                            {
                                id: 'skill-1',
                                name: 'React',
                            },
                        ],
                        status: 'Open',
                        timezones: ['America/New_York'],
                        title: 'Original engagement',
                        workload: 'FULL_TIME',
                    } as any}
                    isEditMode
                    projectId='123'
                />
            </MemoryRouter>,
        )

        const titleField = screen.getByLabelText('Title')

        await user.clear(titleField)
        await user.type(titleField, 'Updated engagement')
        await user.click(screen.getByRole('button', { name: 'Save Engagement' }))

        await waitFor(() => {
            expect(mockedUpdateEngagement)
                .toHaveBeenCalled()
        })

        expect(mockedShowSuccessToast)
            .toHaveBeenCalledWith('Engagement saved successfully')

        expect(mockNavigate)
            .toHaveBeenCalledWith('/work/projects/123/engagements')
    })
})
