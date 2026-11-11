/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import { ChangeEvent, ReactNode } from 'react'
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'

import { WorkAppContext } from '../../contexts/WorkAppContext'
import { WorkAppContextModel } from '../../models'
import { fetchProjectsList } from '../../services'
import { checkCanManageProject } from '../../utils'

import { CreateEngagementFromLeadModal } from './CreateEngagementFromLeadModal'

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: { buttons?: ReactNode, children: ReactNode, title: string }): JSX.Element => (
        <div role='dialog' aria-label={props.title}>
            {props.children}
            {props.buttons && <footer data-testid='modal-footer'>{props.buttons}</footer>}
        </div>
    ),
    Button: (props: { disabled?: boolean, label: string, onClick?: () => void }): JSX.Element => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
}), { virtual: true })

interface Option {
    label: string
    value: string
}

jest.mock('react-select/async', () => ({
    __esModule: true,
    default: (props: {
        'aria-label': string
        loadOptions: (value: string) => Promise<Option[]>
        onChange: (option: Option) => void
    }): JSX.Element => {
        const react: typeof import('react') = jest.requireActual('react')
        const [options, setOptions] = react.useState<Option[]>([])

        return (
            <div>
                <input
                    aria-label={props['aria-label']}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        props.loadOptions(event.target.value)
                            .then(setOptions)
                    }}
                />
                {options.map(option => (
                    <button key={option.value} onClick={() => props.onChange(option)} type='button'>
                        {option.label}
                    </button>
                ))}
            </div>
        )
    },
}))

// The contexts index also loads the context provider, which the modal does not need.
jest.mock('../../contexts', () => jest.requireActual('../../contexts/WorkAppContext'))

jest.mock('../../services', () => ({
    fetchProjectsList: jest.fn(),
}))

jest.mock('../../hooks', () => ({
    useFetchProjectTypes: () => ({
        error: undefined,
        isLoading: false,
        projectTypes: [{ displayName: 'Generic', key: 'generic' }],
    }),
}))

jest.mock('../../utils', () => ({
    checkCanManageProject: jest.fn(),
}))

jest.mock('../ErrorMessage', () => ({
    ErrorMessage: (props: { message: string }): JSX.Element => <p>{props.message}</p>,
}))

jest.mock('../LoadingSpinner', () => ({
    LoadingSpinner: (): JSX.Element => <p>Loading</p>,
}))

jest.mock('../ProjectEditorForm', () => ({
    ProjectEditorForm: (props: {
        embedded: { onCancel: () => void, onCreated: (project: { id: string, name: string }) => void }
    }): JSX.Element => (
        <div>
            <p>Project form</p>
            <button onClick={props.embedded.onCancel} type='button'>Cancel project</button>
            <button
                onClick={() => props.embedded.onCreated({ id: 'project-new', name: 'New Project' })}
                type='button'
            >
                Save project
            </button>
        </div>
    ),
}))

const mockedFetchProjectsList = fetchProjectsList as jest.MockedFunction<typeof fetchProjectsList>
const mockedCheckCanManageProject = checkCanManageProject as jest.MockedFunction<typeof checkCanManageProject>

const context = {
    loginUserInfo: { userId: 1001 },
    userRoles: ['Talent Manager'],
} as unknown as WorkAppContextModel

function renderModal(): { onCancel: jest.Mock, onConfirm: jest.Mock } {
    const handlers = { onCancel: jest.fn(), onConfirm: jest.fn() }

    render(
        <WorkAppContext.Provider value={context}>
            <CreateEngagementFromLeadModal
                accountName='Acme'
                isOpen
                leadId='lead-1'
                roleTitle='React Developer'
                onCancel={handlers.onCancel}
                onConfirm={handlers.onConfirm}
            />
        </WorkAppContext.Provider>,
    )

    return handlers
}

function getCreateEngagementButton(): HTMLButtonElement {
    return screen.getByRole('button', { name: 'Create Engagement' }) as HTMLButtonElement
}

describe('CreateEngagementFromLeadModal', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedCheckCanManageProject.mockReturnValue(true)
        mockedFetchProjectsList.mockResolvedValue({
            metadata: { page: 1, perPage: 20, total: 1, totalPages: 1 },
            projects: [{ id: 'project-1', name: 'Payments' }],
        } as Awaited<ReturnType<typeof fetchProjectsList>>)
    })

    it('searches the projects by name and creates the engagement in the one selected', async () => {
        const handlers = renderModal()

        expect(getCreateEngagementButton().disabled)
            .toBe(true)

        fireEvent.change(screen.getByLabelText('Project'), { target: { value: ' Pay ' } })
        fireEvent.click(await screen.findByRole('button', { name: 'Payments (project-1)' }))

        expect(mockedFetchProjectsList)
            .toHaveBeenCalledWith(expect.objectContaining({ keyword: 'Pay' }))

        fireEvent.click(getCreateEngagementButton())

        expect(handlers.onConfirm)
            .toHaveBeenCalledWith('project-1')
    })

    it('shows why the projects could not be searched', async () => {
        mockedFetchProjectsList.mockRejectedValue(new Error('Projects are unavailable'))
        renderModal()

        fireEvent.change(screen.getByLabelText('Project'), { target: { value: 'Pay' } })

        expect(await screen.findByText('Projects are unavailable'))
            .toBeTruthy()
    })

    it('creates a new project in place and creates the engagement in it', () => {
        const handlers = renderModal()

        fireEvent.click(screen.getByRole('button', { name: 'Create a new project for this engagement' }))

        expect(screen.getByText('Project form'))
            .toBeTruthy()
        expect(screen.queryByLabelText('Project'))
            .toBeNull()
        expect(screen.queryByTestId('modal-footer'))
            .toBeNull()

        fireEvent.click(screen.getByRole('button', { name: 'Save project' }))

        expect(handlers.onConfirm)
            .toHaveBeenCalledWith('project-new')
    })

    it('goes back to selecting a project when creating one is cancelled', () => {
        renderModal()

        fireEvent.click(screen.getByRole('button', { name: 'Create a new project for this engagement' }))
        fireEvent.click(screen.getByRole('button', { name: 'Cancel project' }))

        expect(screen.queryByText('Project form'))
            .toBeNull()
        expect(screen.getByLabelText('Project'))
            .toBeTruthy()
    })

    it('does not offer to create a project to users who cannot create one', () => {
        mockedCheckCanManageProject.mockReturnValue(false)
        renderModal()

        expect(screen.queryByRole('button', { name: 'Create a new project for this engagement' }))
            .toBeNull()
    })
})
