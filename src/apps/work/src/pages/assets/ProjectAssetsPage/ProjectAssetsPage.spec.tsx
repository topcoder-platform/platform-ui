/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { Context, PropsWithChildren, ReactNode } from 'react'
import {
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { WorkAppContextModel } from '../../../lib/models/WorkAppContextModel.model'
import {
    useFetchProject,
    useFetchProjectAttachments,
    useFetchProjectMembers,
} from '../../../lib/hooks'

import { ProjectAssetsPage } from './ProjectAssetsPage'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('filestack-js', () => ({
    init: jest.fn(),
}))
jest.mock('~/apps/review/src/lib', () => ({
    PageWrapper: (
        props: PropsWithChildren<{
            pageTitle?: string
            rightHeader?: ReactNode
            titleAction?: ReactNode
        }>,
    ) => (
        <div>
            <div data-testid='page-right-header'>{props.rightHeader}</div>
            <h1>{props.pageTitle}</h1>
            <div data-testid='page-title-action'>{props.titleAction}</div>
            <div data-testid='page-content'>{props.children}</div>
        </div>
    ),
}), {
    virtual: true,
})
jest.mock('~/config', () => ({
    EnvironmentConfig: {
        FILESTACK: {
            API_KEY: '',
            CNAME: '',
            REGION: '',
            SECURITY: undefined,
        },
    },
}), {
    virtual: true,
})
jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren) => <div>{props.children}</div>,
    Button: (props: {
        label: string
        onClick?: () => void
        primary?: boolean
        secondary?: boolean
    }) => (
        <button
            data-primary={props.primary ? 'true' : 'false'}
            data-secondary={props.secondary ? 'true' : 'false'}
            onClick={props.onClick}
            type='button'
        >
            {props.label}
        </button>
    ),
    IconOutline: {
        PencilIcon: () => <span>pencil-icon</span>,
    },
}), {
    virtual: true,
})
jest.mock('../../../lib/constants', () => ({
    ATTACHMENT_TYPE_FILE: 'file',
    ATTACHMENT_TYPE_LINK: 'link',
    FILE_PICKER_SUBMISSION_CONTAINER_NAME: 'submissions',
    PROJECT_ATTACHMENTS_FOLDER: 'attachments',
}))
jest.mock('../../../lib/components', () => ({
    ConfirmationModal: () => <div>Confirmation Modal</div>,
    ErrorMessage: (props: { message: string }) => <div>{props.message}</div>,
    LoadingSpinner: () => <div>Loading</div>,
    ProjectBillingAccountExpiredNotice: () => <div>Billing Notice</div>,
    ProjectListTabs: () => <div>Project Tabs</div>,
}))
jest.mock('../../../lib/contexts', () => {
    const React = require('react') as typeof import('react')

    mockWorkAppContext = React.createContext<WorkAppContextModel>({
        isAdmin: false,
        isAnonymous: false,
        isCopilot: false,
        isManager: false,
        isReadOnly: false,
        loginUserInfo: undefined,
        userRoles: [],
    })

    return {
        WorkAppContext: mockWorkAppContext,
    }
})
jest.mock('../../../lib/hooks', () => ({
    useFetchProject: jest.fn(),
    useFetchProjectAttachments: jest.fn(),
    useFetchProjectMembers: jest.fn(),
}))
jest.mock('../../../lib/services', () => ({
    addProjectAttachment: jest.fn(),
    fetchProjectAttachment: jest.fn(),
    removeProjectAttachment: jest.fn(),
    updateProjectAttachment: jest.fn(),
}))
jest.mock('../../../lib/utils', () => ({
    checkCanManageProject: jest.fn(() => false),
}))

const mockedUseFetchProject = useFetchProject as jest.Mock
const mockedUseFetchProjectAttachments = useFetchProjectAttachments as jest.Mock
const mockedUseFetchProjectMembers = useFetchProjectMembers as jest.Mock

const defaultContextValue: WorkAppContextModel = {
    isAdmin: true,
    isAnonymous: false,
    isCopilot: false,
    isManager: false,
    isReadOnly: false,
    loginUserInfo: {
        email: 'admin@example.com',
        exp: 0,
        handle: 'admin-user',
        iat: 0,
        roles: ['administrator'],
        userId: 12345,
    } as WorkAppContextModel['loginUserInfo'],
    userRoles: ['administrator'],
}

function renderPage(
    route: string,
    contextValue: WorkAppContextModel = defaultContextValue,
): void {
    const MockWorkAppContext = mockWorkAppContext

    render(
        <MockWorkAppContext.Provider value={contextValue}>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path='/projects/:projectId/assets' element={<ProjectAssetsPage />} />
                </Routes>
            </MemoryRouter>
        </MockWorkAppContext.Provider>,
    )
}

describe('ProjectAssetsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            project: undefined,
        })
        mockedUseFetchProjectAttachments.mockReturnValue({
            attachments: [],
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })
        mockedUseFetchProjectMembers.mockReturnValue({
            error: undefined,
            isLoading: false,
            members: [],
            mutate: jest.fn(),
        })
    })

    it('keeps the project name unchanged for the project assets tab', () => {
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            project: {
                id: 200,
                name: 'Payment Testing',
            },
        })

        renderPage('/projects/200/assets')

        expect(screen.getByRole('heading', { level: 1, name: 'Payment Testing' }))
            .toBeTruthy()
        expect(screen.queryByText('Payment Testing Assets'))
            .toBeNull()
        expect(screen.getByText('Assets Library'))
            .toBeTruthy()
    })
})
