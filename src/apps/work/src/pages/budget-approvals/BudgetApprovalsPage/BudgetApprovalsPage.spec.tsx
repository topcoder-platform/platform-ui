/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type {
    Context,
    PropsWithChildren,
} from 'react'
import {
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import {
    useFetchChallenges,
    useFetchProjects,
} from '../../../lib/hooks'
import { WorkAppContextModel } from '../../../lib/models'

import { BudgetApprovalsPage } from './BudgetApprovalsPage'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('~/apps/review/src/lib', () => ({
    PageWrapper: (props: PropsWithChildren<{ pageTitle?: string }>) => (
        <div>
            <h1>{props.pageTitle}</h1>
            {props.children}
        </div>
    ),
}), {
    virtual: true,
})
jest.mock('~/libs/ui', () => ({
    IconOutline: {
        ExternalLinkIcon: () => <span>external-link-icon</span>,
    },
}), {
    virtual: true,
})
jest.mock('../../../lib/components', () => ({
    Pagination: () => <div>Pagination</div>,
}))
jest.mock('../../../lib/constants', () => ({
    CHALLENGE_APPROVAL_STATUS: {
        PENDING_APPROVAL: 'PENDING_APPROVAL',
    },
    CHALLENGE_STATUS: {
        DRAFT: 'DRAFT',
    },
    PAGE_SIZE: 10,
    PROJECT_ROLES: {
        COPILOT: 'copilot',
        MANAGER: 'manager',
    },
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
    useFetchChallenges: jest.fn(),
    useFetchProjects: jest.fn(),
}))
jest.mock('react-select', () => ({
    __esModule: true,
    default: (props: {
        inputId?: string
        onChange: (option?: { label: string; value: string }) => void
        options: Array<{ label: string; value: string }>
        placeholder?: string
        value?: { label: string; value: string }
    }) => {
        function handleChange(event: { target: { value: string } }): void {
            const selectedOption = props.options.find(option => option.value === event.target.value)
            props.onChange(selectedOption)
        }

        return (
            <select
                aria-label={props.inputId}
                data-testid={props.inputId}
                onChange={handleChange}
                value={props.value?.value ?? ''}
            >
                <option value=''>{props.placeholder}</option>
                {props.options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        )
    },
}))

const mockedUseFetchChallenges = useFetchChallenges as jest.Mock
const mockedUseFetchProjects = useFetchProjects as jest.Mock

const managerContextValue: WorkAppContextModel = {
    isAdmin: false,
    isAnonymous: false,
    isCopilot: false,
    isManager: true,
    isReadOnly: false,
    loginUserInfo: {
        email: 'manager@example.com',
        exp: 0,
        handle: 'manager-user',
        iat: 0,
        roles: ['project manager'],
        userId: 12345,
    } as WorkAppContextModel['loginUserInfo'],
    userRoles: ['project manager'],
}

describe('BudgetApprovalsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedUseFetchChallenges.mockReturnValue({
            challenges: [],
            error: undefined,
            isLoading: false,
            isValidating: false,
            metadata: {
                page: 1,
                perPage: 10,
                total: 0,
                totalPages: 0,
            },
            mutate: jest.fn(),
        })
        mockedUseFetchProjects.mockReturnValue({
            error: undefined,
            isLoading: false,
            isValidating: false,
            projects: [],
        })
    })

    it('scopes manager budget approvals to full access project memberships only', () => {
        const MockWorkAppContext = mockWorkAppContext

        mockedUseFetchProjects.mockReturnValue({
            error: undefined,
            isLoading: false,
            isValidating: false,
            projects: [
                {
                    id: 'full-access-project',
                    members: [{
                        role: 'manager',
                        userId: 12345,
                    }],
                    name: 'Full Access Project',
                    status: 'active',
                },
                {
                    id: 'copilot-project',
                    members: [{
                        role: 'copilot',
                        userId: 12345,
                    }],
                    name: 'Copilot Project',
                    status: 'active',
                },
                {
                    id: 'write-project',
                    members: [{
                        role: 'customer',
                        userId: 12345,
                    }],
                    name: 'Write Project',
                    status: 'active',
                },
            ],
        })

        render(
            <MockWorkAppContext.Provider value={managerContextValue}>
                <MemoryRouter>
                    <BudgetApprovalsPage />
                </MemoryRouter>
            </MockWorkAppContext.Provider>,
        )

        expect(mockedUseFetchProjects)
            .toHaveBeenCalledWith({
                memberOnly: true,
            })
        expect(mockedUseFetchChallenges)
            .toHaveBeenCalledWith(expect.objectContaining({
                approvalStatus: 'PENDING_APPROVAL',
                projectIds: ['full-access-project'],
                status: 'DRAFT',
            }))
        expect(screen.getByRole('option', { name: 'Full Access Project' }))
            .toBeTruthy()
        expect(screen.queryByRole('option', { name: 'Copilot Project' }))
            .toBeNull()
        expect(screen.queryByRole('option', { name: 'Write Project' }))
            .toBeNull()
    })
})
