/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { createProjectShowcasePost } from '../../../lib/services'
import {
    useFetchProject,
    useFetchProjectShowcasePosts,
    useFetchProjectShowcasePostCategories,
    useFetchProjectShowcasePostIndustries,
} from '../../../lib/hooks'
import { showSuccessToast } from '../../../lib/utils/toast.utils'

import { ProjectShowcasePage } from './ProjectShowcasePage'

jest.mock('~/config', () => ({ AppSubdomain: { work: 'work' }, EnvironmentConfig: {} }), { virtual: true })
jest.mock('filestack-js', () => ({ init: jest.fn() }))
jest.mock('react-router-dom', () => ({ useParams: () => ({ projectId: '123' }) }))
jest.mock('~/libs/ui', () => ({
    BaseModal: (props: any): JSX.Element => (props.open ? <div>{props.children}</div> : <></>),
    Button: (props: any): JSX.Element => (
        <button
            type={props.type === 'submit' ? 'submit' : 'button'}
            onClick={props.onClick}
            disabled={props.disabled}
        >
            {props.label}
        </button>
    ),
    LoadingSpinner: (): JSX.Element => <div />,
    useConfirmationModal: () => ({}),
}), { virtual: true })
jest.mock('../../../lib/contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')
    return { WorkAppContext: React.createContext({ isAdmin: true, loginUserInfo: { userId: 42 }, userRoles: [] }) }
})
jest.mock('../../../lib/components', () => ({
    ErrorMessage: (props: any): JSX.Element => <div>{props.message}</div>,
    Pagination: (): JSX.Element => <div />,
    ProjectPageWrapper: (props: any): JSX.Element => (
        <div>
            {props.headerActions}
            {props.children}
        </div>
    ),
    ProjectsShowcaseFilter: (): JSX.Element => <div />,
    ShowcasePostPreview: (): JSX.Element => <div />,
}))
jest.mock('../../../lib/components/form', () => {
    const forms: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
    return {
        FormCheckboxField: (props: any): JSX.Element => {
            const form = forms.useFormContext()
            return <input aria-label={props.label} type='checkbox' {...form.register(props.name)} />
        },
        FormMarkdownEditor: (props: any): JSX.Element => {
            const form = forms.useFormContext()
            return <textarea aria-label={props.label} {...form.register(props.name)} />
        },
        FormSelectField: (props: any): JSX.Element => {
            const form = forms.useFormContext()
            return (
                <select aria-label={props.label} multiple={props.isMulti} {...form.register(props.name)}>
                    {!props.isMulti && <option value=''>Select</option>}
                    {(props.options || []).map((option: any) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            )
        },
        FormTextField: (props: any): JSX.Element => {
            const form = forms.useFormContext()
            return <input aria-label={props.label} {...form.register(props.name)} />
        },
    }
})
jest.mock('../../../lib/services/salesforce-opportunities.service', () => ({
    fetchSalesforceOpportunity: jest.fn(),
    salesforceOpportunityErrorMessage: () => 'We could not reach Salesforce. Please try again.',
}))

jest.mock('../../../lib/services', () => ({
    createProjectShowcasePost: jest.fn(),
}))
jest.mock('../../../lib/hooks', () => ({
    useFetchProject: jest.fn(),
    useFetchProjectShowcasePostCategories: jest.fn(),
    useFetchProjectShowcasePostIndustries: jest.fn(),
    useFetchProjectShowcasePosts: jest.fn(),
}))
jest.mock('../../../lib/utils/permissions.utils', () => ({
    checkCanManageProject: () => true,
    hasManagerRole: () => true,
}))
jest.mock('../../../lib/utils/toast.utils', () => ({ showErrorToast: jest.fn(), showSuccessToast: jest.fn() }))

describe('Showcase creation', () => {
    const refreshProject = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks();
        (useFetchProject as jest.Mock).mockReturnValue({
            mutate: refreshProject,
            project: { details: { customer: 'Customer', dealCloseDate: '2026-09-16', smu: 'Europe' } },
        });
        (useFetchProjectShowcasePosts as jest.Mock).mockReturnValue({
            metadata: { total: 0 }, mutate: jest.fn(), posts: [],
        });
        (useFetchProjectShowcasePostIndustries as jest.Mock).mockReturnValue({
            items: [{ id: '1', name: 'Industry' }], mutate: jest.fn(),
        });
        (useFetchProjectShowcasePostCategories as jest.Mock).mockReturnValue({
            items: [{ id: '2', name: 'Technology' }], mutate: jest.fn(),
        });
        (createProjectShowcasePost as jest.Mock).mockResolvedValue({ id: '1' })
    })

    /**
     * Opens the form and fills the required fields for the save-path tests.
     * @returns Nothing; updates the rendered form through user input events.
     * @throws Testing Library errors if an expected field is missing.
     */
    function fillPost(): void {
        render(<ProjectShowcasePage />)
        fireEvent.click(screen.getByRole('button', { name: 'Create Post' }))
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Title' } })
        fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'Open Innovation' } })
        fireEvent.change(screen.getByLabelText('The Solution'), { target: { value: 'Solution' } })
        for (const label of ['Industry/Sector', 'Category/Technology']) {
            const select = screen.getByLabelText(label) as HTMLSelectElement
            select.options[0].selected = true
            fireEvent.change(select)
        }
    }

    it('prefills project metadata, defaults WIN off and saves metadata with the post', async () => {
        fillPost()
        expect((screen.getByLabelText(/^Customer/) as HTMLInputElement).value)
            .toBe('Customer')
        expect((screen.getByLabelText(/^Deal Close Date/) as HTMLInputElement).value)
            .toBe('2026-09-16')
        expect((screen.getByLabelText('Send to WIN') as HTMLInputElement).checked)
            .toBe(false)
        fireEvent.change(screen.getByLabelText(/^Customer/), { target: { value: 'Updated customer' } })
        fireEvent.click(screen.getByLabelText('Send to WIN'))
        fireEvent.click(screen.getByRole('button', { name: 'Create' }))
        await waitFor(() => expect(createProjectShowcasePost)
            .toHaveBeenCalledWith('123', expect.objectContaining({
                content: 'Solution',
                customer: 'Updated customer',
                dealCloseDate: '2026-09-16',
                sendToWin: true,
                // Legacy labels are upgraded to the Salesforce-aligned option on save.
                smu: 'EURP',
                type: 'Open Innovation',
            })))
        await waitFor(() => expect(refreshProject)
            .toHaveBeenCalled())
        expect(showSuccessToast)
            .toHaveBeenCalledWith('Post created successfully and made available to WIN')
    })

    it('keeps the form and reports the API error when saving fails', async () => {
        (createProjectShowcasePost as jest.Mock).mockRejectedValue(new Error('Unable to save showcase'))
        fillPost()
        fireEvent.click(screen.getByRole('button', { name: 'Create' }))
        await screen.findByText('Unable to save showcase')
        expect(screen.getByLabelText('Title'))
            .toBeTruthy()
        expect(showSuccessToast).not.toHaveBeenCalled()
    })

    it('blocks a save without a type and customer', async () => {
        fillPost()
        fireEvent.change(screen.getByLabelText('Type'), { target: { value: '' } })
        fireEvent.change(screen.getByLabelText(/^Customer/), { target: { value: ' ' } })
        fireEvent.click(screen.getByRole('button', { name: 'Create' }))
        await screen.findByText('Customer is required')
        expect(createProjectShowcasePost).not.toHaveBeenCalled()
    })
})
