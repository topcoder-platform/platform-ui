/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import { useConfirmationModal } from '~/libs/ui'

import { createProjectShowcasePost, fetchProjectShowcasePost, updateProjectShowcasePost } from '../../../lib/services'
import {
    useFetchProject,
    useFetchProjectShowcasePosts,
    useFetchProjectShowcasePostCategories,
    useFetchProjectShowcasePostIndustries,
} from '../../../lib/hooks'
import { showErrorToast, showSuccessToast } from '../../../lib/utils/toast.utils'

import { ProjectShowcasePostDetails } from '../../../lib/models'

import { ProjectShowcasePage } from './ProjectShowcasePage'

jest.mock('~/config', () => ({
    AppSubdomain: { work: 'work' },
    EnvironmentConfig: { URLS: { CHALLENGES_PAGE: '/challenges', WORK_APP: '/work' } },
}), { virtual: true })
jest.mock('filestack-js', () => ({ init: jest.fn() }))
jest.mock('react-router-dom', () => ({ useParams: () => ({ projectId: '123' }) }))
jest.mock('~/libs/ui', () => ({
    BaseModal: (props: any): JSX.Element => (props.open
        ? <div role='dialog' aria-label={props.title}>{props.children}</div> : <></>),
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
    useConfirmationModal: jest.fn(),
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
    fetchProjectShowcasePost: jest.fn(),
    updateProjectShowcasePost: jest.fn(),
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

describe('Showcase creation and publishing', () => {
    const refreshProject = jest.fn()
    const refreshPosts = jest.fn()
    const confirm = jest.fn()
    const draft: ProjectShowcasePostDetails = {
        categories: [{ id: '2', name: 'Technology' }],
        challengeMetadata: [],
        content: 'Saved solution',
        createdAt: '2026-09-16T00:00:00Z',
        createdById: 42,
        customer: 'Customer',
        dealCloseDate: '2026-09-16',
        id: '7',
        industries: [{ id: '1', name: 'Industry' }],
        projectTitle: 'Project',
        smu: 'EURP',
        status: 'DRAFT',
        title: 'Saved story',
        type: 'Open Innovation',
    }

    beforeEach(() => {
        jest.clearAllMocks();
        (useConfirmationModal as jest.Mock).mockReturnValue({ confirm })
        confirm.mockResolvedValue(true);
        (useFetchProject as jest.Mock).mockReturnValue({
            mutate: refreshProject,
            project: { details: { customer: 'Customer', dealCloseDate: '2026-09-16', smu: 'Europe' } },
        });
        (useFetchProjectShowcasePosts as jest.Mock).mockReturnValue({
            metadata: { total: 0 }, mutate: refreshPosts, posts: [],
        });
        (useFetchProjectShowcasePostIndustries as jest.Mock).mockReturnValue({
            items: [{ id: '1', name: 'Industry' }], mutate: jest.fn(),
        });
        (useFetchProjectShowcasePostCategories as jest.Mock).mockReturnValue({
            items: [{ id: '2', name: 'Technology' }], mutate: jest.fn(),
        });
        (createProjectShowcasePost as jest.Mock).mockResolvedValue({ id: '1' });
        (updateProjectShowcasePost as jest.Mock).mockResolvedValue({ ...draft, status: 'PUBLISHED' });
        (fetchProjectShowcasePost as jest.Mock).mockResolvedValue(draft)
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
        expect((createProjectShowcasePost as jest.Mock).mock.calls[0][1]).not.toHaveProperty('status')
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

    /**
     * Renders a saved story so tests can enter the edit and list-preview flows.
     * @param status Saved story status, defaulting to DRAFT.
     * @returns Nothing; configures API responses and renders the page.
     * @throws Testing Library errors if rendering fails.
     */
    function renderSavedPost(status: string = 'DRAFT'): void {
        const post = { ...draft, status };
        (fetchProjectShowcasePost as jest.Mock).mockResolvedValue(post);
        (useFetchProjectShowcasePosts as jest.Mock).mockReturnValue({
            metadata: { total: 1 }, mutate: refreshPosts, posts: [post],
        })
        render(<ProjectShowcasePage />)
    }

    it('publishes a new story with current form values in a single create request', async () => {
        fillPost()
        fireEvent.click(screen.getByLabelText('Send to WIN'))
        fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
        await waitFor(() => expect(createProjectShowcasePost)
            .toHaveBeenCalledWith('123', expect.objectContaining({
                content: 'Solution', sendToWin: true, status: 'PUBLISHED', title: 'Title',
            })))
        expect(createProjectShowcasePost)
            .toHaveBeenCalledTimes(1)
        expect(updateProjectShowcasePost).not.toHaveBeenCalled()
        expect(confirm)
            .toHaveBeenCalledWith(expect.objectContaining({ title: 'Publish Post' }))
        await waitFor(() => expect(screen.queryByRole('dialog'))
            .toBeNull())
        expect(refreshPosts)
            .toHaveBeenCalled()
        expect(showSuccessToast)
            .toHaveBeenCalledWith('Post published successfully and made available to WIN')
    })

    it('does not save or publish when confirmation is cancelled', async () => {
        confirm.mockResolvedValue(false)
        fillPost()
        fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
        await waitFor(() => expect(confirm)
            .toHaveBeenCalled())
        expect(createProjectShowcasePost).not.toHaveBeenCalled()
        expect(screen.getByLabelText('Title'))
            .toBeTruthy()
    })

    it('validates required fields before confirming publication', async () => {
        fillPost()
        fireEvent.change(screen.getByLabelText(/^Customer/), { target: { value: '' } })
        fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
        await screen.findByText('Customer is required')
        expect(confirm).not.toHaveBeenCalled()
        expect(createProjectShowcasePost).not.toHaveBeenCalled()
    })

    it('publishes edits with the current content instead of the saved draft content', async () => {
        renderSavedPost()
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
        await screen.findByDisplayValue('Saved solution')
        fireEvent.change(screen.getByLabelText('The Solution'), { target: { value: 'Updated solution' } })
        const form = within(screen.getByRole('dialog', { name: 'Edit Post' }))
        fireEvent.click(form.getByRole('button', { name: 'Publish' }))
        await waitFor(() => expect(updateProjectShowcasePost)
            .toHaveBeenCalledWith('123', '7', expect.objectContaining({
                content: 'Updated solution', status: 'PUBLISHED', title: 'Saved story',
            })))
        expect(createProjectShowcasePost).not.toHaveBeenCalled()
        await waitFor(() => expect(screen.queryByRole('dialog'))
            .toBeNull())
    })

    it('keeps normal edits from changing the publication status', async () => {
        renderSavedPost()
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
        await screen.findByDisplayValue('Saved solution')
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))
        await waitFor(() => expect(updateProjectShowcasePost)
            .toHaveBeenCalled())
        expect((updateProjectShowcasePost as jest.Mock).mock.calls[0][2]).not.toHaveProperty('status')
        expect(confirm).not.toHaveBeenCalled()
    })

    it('publishes a new story from its preview and closes both dialogs', async () => {
        fillPost()
        fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
        const preview = within(screen.getByRole('dialog', { name: 'Preview' }))
        await waitFor(() => expect((preview.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled)
            .toBe(false))
        fireEvent.click(preview.getByRole('button', { name: 'Publish' }))
        await waitFor(() => expect(createProjectShowcasePost)
            .toHaveBeenCalledWith('123', expect.objectContaining({
                content: 'Solution', status: 'PUBLISHED', title: 'Title',
            })))
        await waitFor(() => expect(screen.queryByRole('dialog'))
            .toBeNull())
    })

    it('publishes unsaved edits from the edit preview', async () => {
        renderSavedPost()
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
        await screen.findByDisplayValue('Saved solution')
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated title' } })
        const form = within(screen.getByRole('dialog', { name: 'Edit Post' }))
        fireEvent.click(form.getByRole('button', { name: 'Preview' }))
        const preview = within(screen.getByRole('dialog', { name: 'Preview' }))
        await waitFor(() => expect((preview.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled)
            .toBe(false))
        fireEvent.click(preview.getByRole('button', { name: 'Publish' }))
        await waitFor(() => expect(updateProjectShowcasePost)
            .toHaveBeenCalledWith('123', '7', expect.objectContaining({
                status: 'PUBLISHED', title: 'Updated title',
            })))
        await waitFor(() => expect(screen.queryByRole('dialog'))
            .toBeNull())
    })

    it('returns to the form when publishing an invalid preview', async () => {
        fillPost()
        fireEvent.change(screen.getByLabelText(/^Customer/), { target: { value: '' } })
        fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
        const preview = within(screen.getByRole('dialog', { name: 'Preview' }))
        await waitFor(() => expect((preview.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled)
            .toBe(false))
        fireEvent.click(preview.getByRole('button', { name: 'Publish' }))
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Preview' }))
            .toBeNull())
        expect(screen.getByRole('dialog', { name: 'Create Post' }))
            .toBeTruthy()
        expect(confirm).not.toHaveBeenCalled()
        expect(createProjectShowcasePost).not.toHaveBeenCalled()
    })

    it('returns to the form with its values and error when publication from preview fails', async () => {
        (createProjectShowcasePost as jest.Mock).mockRejectedValue(new Error('Publication failed'))
        fillPost()
        fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
        const preview = within(screen.getByRole('dialog', { name: 'Preview' }))
        await waitFor(() => expect((preview.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled)
            .toBe(false))
        fireEvent.click(preview.getByRole('button', { name: 'Publish' }))
        await screen.findByText('Publication failed')
        expect(screen.queryByRole('dialog', { name: 'Preview' }))
            .toBeNull()
        expect(screen.getByDisplayValue('Title'))
            .toBeTruthy()
        expect(showSuccessToast).not.toHaveBeenCalled()
    })

    it('disables repeated publication while the request is in progress', async () => {
        let complete: (value: unknown) => void = () => undefined;
        (createProjectShowcasePost as jest.Mock).mockReturnValue(new Promise(resolve => { complete = resolve }))
        fillPost()
        fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
        await waitFor(() => expect(createProjectShowcasePost)
            .toHaveBeenCalledTimes(1))
        expect((screen.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled)
            .toBe(true)
        expect((screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement).disabled)
            .toBe(true)
        fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
        expect(createProjectShowcasePost)
            .toHaveBeenCalledTimes(1)
        complete({ id: '1' })
        await waitFor(() => expect(screen.queryByRole('dialog'))
            .toBeNull())
    })

    it('cancels a preview without saving or discarding form edits', async () => {
        fillPost()
        fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
        const preview = within(screen.getByRole('dialog', { name: 'Preview' }))
        await waitFor(() => expect((preview.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled)
            .toBe(false))
        fireEvent.click(preview.getByRole('button', { name: 'Cancel' }))
        expect(screen.queryByRole('dialog', { name: 'Preview' }))
            .toBeNull()
        expect(screen.getByDisplayValue('Title'))
            .toBeTruthy()
        expect(createProjectShowcasePost).not.toHaveBeenCalled()
    })

    it('publishes the saved draft from the list preview without submitting form defaults', async () => {
        renderSavedPost()
        fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
        const preview = within(screen.getByRole('dialog', { name: 'Preview' }))
        await waitFor(() => expect((preview.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled)
            .toBe(false))
        fireEvent.click(preview.getByRole('button', { name: 'Publish' }))
        await waitFor(() => expect(updateProjectShowcasePost)
            .toHaveBeenCalledWith('123', '7', { status: 'PUBLISHED' }))
        await waitFor(() => expect(screen.queryByRole('dialog'))
            .toBeNull())
        expect(createProjectShowcasePost).not.toHaveBeenCalled()
        expect(refreshPosts)
            .toHaveBeenCalled()
    })

    it('keeps the list preview open and reports publication errors', async () => {
        (updateProjectShowcasePost as jest.Mock).mockRejectedValue(new Error('Publication failed'))
        renderSavedPost()
        fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
        const preview = within(screen.getByRole('dialog', { name: 'Preview' }))
        await waitFor(() => expect((preview.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled)
            .toBe(false))
        fireEvent.click(preview.getByRole('button', { name: 'Publish' }))
        await waitFor(() => expect(showErrorToast)
            .toHaveBeenCalledWith('Publication failed'))
        expect(screen.getByRole('dialog', { name: 'Preview' }))
            .toBeTruthy()
        expect(showSuccessToast).not.toHaveBeenCalled()
    })

    it.each(['PUBLISHED', 'ARCHIVED'])('does not offer Publish for a %s list preview', async status => {
        renderSavedPost(status)
        fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
        const preview = within(screen.getByRole('dialog', { name: 'Preview' }))
        await waitFor(() => expect(preview.queryByRole('button', { name: 'Publish' }))
            .toBeNull())
        fireEvent.click(preview.getByRole('button', { name: 'Cancel' }))
        expect(screen.queryByRole('dialog'))
            .toBeNull()
        expect(updateProjectShowcasePost).not.toHaveBeenCalled()
    })

    it('does not offer Publish when editing a published story', async () => {
        renderSavedPost('PUBLISHED')
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
        await screen.findByDisplayValue('Saved solution')
        const form = within(screen.getByRole('dialog', { name: 'Edit Post' }))
        expect(form.queryByRole('button', { name: 'Publish' }))
            .toBeNull()
        expect(form.getByRole('button', { name: 'Save' }))
            .toBeTruthy()
    })

})
