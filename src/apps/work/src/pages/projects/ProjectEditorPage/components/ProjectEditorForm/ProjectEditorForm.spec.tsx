/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import {
    useFetchProjectBillingAccount,
} from '../../../../../lib/hooks'
import {
    createProject,
    updateProject,
} from '../../../../../lib/services'

import { ProjectEditorForm } from './ProjectEditorForm'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ADMIN: {
            DIRECT_URL: 'https://direct.example.com',
            REVIEW_UI_URL: 'https://review.example.com',
        },
        API: {
            V6: 'https://example.com/v6',
        },
        CHALLENGE_API_URL: 'https://example.com/v5/challenges',
        CHALLENGE_API_VERSION: 'v5',
        COMMUNITY_APP_URL: 'https://community.example.com',
        COPILOTS_URL: 'https://copilots.example.com',
        DIRECT_PROJECT_URL: 'https://direct.example.com',
        ENGAGEMENTS_URL: 'https://work.example.com',
        REVIEW_APP_URL: 'https://review.example.com',
        TC_DOMAIN: 'example.com',
        TC_FINANCE_API: 'https://finance.example.com',
        TOPCODER_URL: 'https://topcoder.example.com',
    },
}), {
    virtual: true,
})

jest.mock('../../../../../lib/components/form', () => {
    const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
    const useFormContext: typeof reactHookForm.useFormContext = reactHookForm.useFormContext

    interface MockFieldProps {
        label: string
        name: string
        options?: Array<{
            label: string
            value: string
        }>
        placeholder?: string
    }

    return {
        FormBillingAccountAutocomplete: (props: MockFieldProps): JSX.Element => {
            const formContext = useFormContext()

            return (
                <input
                    aria-label={props.label}
                    {...formContext.register(props.name)}
                />
            )
        },
        FormCheckboxField: (props: MockFieldProps): JSX.Element => {
            const formContext = useFormContext()

            return (
                <label htmlFor={props.name}>
                    <input
                        id={props.name}
                        type='checkbox'
                        {...formContext.register(props.name)}
                    />
                    {props.label}
                </label>
            )
        },
        FormGroupsSelect: (): JSX.Element => <div />,
        FormRadioGroup: (): JSX.Element => <div />,
        FormSelectField: (props: MockFieldProps): JSX.Element => {
            const formContext = useFormContext()

            return (
                <label htmlFor={props.name}>
                    {props.label}
                    <select
                        aria-label={props.label}
                        id={props.name}
                        {...formContext.register(props.name)}
                    >
                        <option value=''>{props.placeholder || 'Select'}</option>
                        {(props.options || []).map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            )
        },
        FormSelectOption: undefined,
        FormTextAreaField: (props: MockFieldProps): JSX.Element => {
            const formContext = useFormContext()

            return (
                <label htmlFor={props.name}>
                    {props.label}
                    <textarea
                        aria-label={props.label}
                        id={props.name}
                        {...formContext.register(props.name)}
                    />
                </label>
            )
        },
        FormTextField: (props: MockFieldProps): JSX.Element => {
            const formContext = useFormContext()

            return (
                <label htmlFor={props.name}>
                    {props.label}
                    <input
                        aria-label={props.label}
                        id={props.name}
                        {...formContext.register(props.name)}
                    />
                </label>
            )
        },
    }
})

jest.mock('../../../../../lib/hooks', () => ({
    useFetchProjectBillingAccount: jest.fn(),
}))

jest.mock('../../../../../lib/services', () => ({
    createProject: jest.fn(),
    updateProject: jest.fn(),
}))

jest.mock('../../../../../lib/utils', () => ({
    formatDate: () => '-',
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        disabled?: boolean
        label: string
        type?: 'button' | 'submit'
    }): JSX.Element => (
        <button
            disabled={props.disabled}
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

const mockedUseFetchProjectBillingAccount = useFetchProjectBillingAccount as jest.MockedFunction<
    typeof useFetchProjectBillingAccount
>
const mockedCreateProject = createProject as jest.MockedFunction<typeof createProject>
const mockedUpdateProject = updateProject as jest.MockedFunction<typeof updateProject>

describe('ProjectEditorForm', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedUseFetchProjectBillingAccount.mockReturnValue({
            billingAccount: undefined,
            isLoading: false,
        })
        mockedCreateProject.mockResolvedValue({
            id: 'project-1',
            name: 'Payments Project',
            status: 'draft',
        })
        mockedUpdateProject.mockResolvedValue({
            id: 'project-1',
            name: 'Payments Project',
            status: 'active',
        })
    })

    it('defaults the copilot payment details flag on for new projects and submits it', async () => {
        render(
            <MemoryRouter>
                <ProjectEditorForm
                    canManage
                    isEdit={false}
                    projectTypes={[{
                        displayName: 'Generic',
                        key: 'generic',
                    }]}
                />
            </MemoryRouter>,
        )

        const displayPaymentDetailsCheckbox = screen.getByLabelText(
            'Display member payment details to copilots',
        ) as HTMLInputElement

        expect(displayPaymentDetailsCheckbox.checked)
            .toBe(true)

        fireEvent.change(screen.getByLabelText('Project Name'), {
            target: {
                value: 'Payments Project',
            },
        })
        fireEvent.change(screen.getByLabelText('Project Type'), {
            target: {
                value: 'generic',
            },
        })
        fireEvent.change(screen.getByLabelText('Description'), {
            target: {
                value: 'Project with visible copilot payment details.',
            },
        })
        await waitFor(() => expect((screen.getByRole('button', {
            name: 'Save project',
        }) as HTMLButtonElement).disabled)
            .toBe(false))

        fireEvent.click(screen.getByRole('button', {
            name: 'Save project',
        }))

        await waitFor(() => expect(mockedCreateProject)
            .toHaveBeenCalledWith(expect.objectContaining({
                details: {
                    displayMemberPaymentDetailsToCopilots: true,
                },
            })))
    })

    it('submits null when clearing an existing project billing account', async () => {
        render(
            <MemoryRouter>
                <ProjectEditorForm
                    canManage
                    isEdit
                    projectDetail={{
                        billingAccountId: '80001063',
                        description: 'Project with billing',
                        id: 'project-1',
                        name: 'Payments Project',
                        status: 'active',
                    }}
                    projectTypes={[]}
                />
            </MemoryRouter>,
        )

        fireEvent.change(screen.getByLabelText('Select New Billing Account'), {
            target: {
                value: '',
            },
        })

        await waitFor(() => expect((screen.getByRole('button', {
            name: 'Save project',
        }) as HTMLButtonElement).disabled)
            .toBe(false))

        fireEvent.click(screen.getByRole('button', {
            name: 'Save project',
        }))

        await waitFor(() => expect(mockedUpdateProject)
            .toHaveBeenCalledWith('project-1', expect.any(Object)))
        expect(mockedUpdateProject.mock.calls[0]?.[1].billingAccountId)
            .toBeNull()
    })
})
