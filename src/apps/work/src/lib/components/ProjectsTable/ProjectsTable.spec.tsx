/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { ReactNode } from 'react'
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { WorkAppContext } from '../../contexts/WorkAppContext'
import type {
    Project,
    WorkAppContextModel,
} from '../../models'
import type { BillingAccountDetails } from '../../services'
import {
    useFetchBillingAccountDetails,
    useFetchBillingAccounts,
} from '../../hooks'

import { ProjectsTable } from './ProjectsTable'

jest.mock('../../hooks', () => ({
    useFetchBillingAccountDetails: jest.fn(),
    useFetchBillingAccounts: jest.fn(),
}))

jest.mock('../BillingAccountLineItemsModal', () => ({
    BillingAccountLineItemsModal: (props: {
        billingAccountDetails: BillingAccountDetails
    }): JSX.Element => (
        <div role='dialog'>
            Billing account details for
            {' '}
            {props.billingAccountDetails.id}
        </div>
    ),
}))

jest.mock('../../constants', () => ({
    PROJECT_STATUS: {
        DRAFT: 'draft',
    },
}))

jest.mock('../../utils', () => ({
    buildProjectChallengesPath: (projectId: string | number) => (
        `/projects/${encodeURIComponent(String(projectId))}/challenges`
    ),
    formatDateTime: () => 'Apr 6, 2026',
}))

jest.mock('~/libs/ui', () => ({
    IconOutline: {
        InformationCircleIcon: (): JSX.Element => <span>info</span>,
    },
    LoadingSpinner: () => <div>Loading</div>,
    Table: (props: {
        columns: Array<{
            label: string
            renderer?: (project: Project) => ReactNode
        }>
        data: Project[]
    }) => (
        <div>
            {props.data.map(project => (
                <div key={String(project.id)}>
                    {props.columns.map(column => (
                        <div key={column.label}>
                            {column.renderer ? column.renderer(project) : undefined}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    ),
}), {
    virtual: true,
})

jest.mock('../ProjectStatus', () => ({
    ProjectStatus: () => <span>Active</span>,
}))

const mockedUseFetchBillingAccountDetails = useFetchBillingAccountDetails as jest.MockedFunction<
    typeof useFetchBillingAccountDetails
>
const mockedUseFetchBillingAccounts = useFetchBillingAccounts as jest.MockedFunction<typeof useFetchBillingAccounts>

const billingAccountDetails: BillingAccountDetails = {
    budget: 1000,
    consumedAmounts: [],
    consumedBudget: 225,
    id: 80001063,
    lockedAmounts: [],
    lockedBudget: 125,
    name: 'Access BA',
    totalBudgetRemaining: 650,
}

const defaultContextValue: WorkAppContextModel = {
    isAdmin: false,
    isAnonymous: false,
    isCopilot: false,
    isManager: false,
    isReadOnly: false,
    loginUserInfo: undefined,
    userRoles: [],
}

describe('ProjectsTable', () => {
    const invitedProject: Project = {
        id: 100440,
        invites: [
            {
                email: 'invitee@example.com',
                status: 'pending',
                userId: 123,
            },
        ],
        isInvited: true,
        name: 'SK project1',
        status: 'active',
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockedUseFetchBillingAccounts.mockReturnValue({
            billingAccounts: [],
            error: undefined,
            isError: false,
            isLoading: false,
        })
        mockedUseFetchBillingAccountDetails.mockReturnValue({
            billingAccountDetails: undefined,
            error: undefined,
            isError: false,
            isLoading: false,
        })
    })

    function renderTable(
        projects: Project[],
        contextValue: WorkAppContextModel = defaultContextValue,
    ): void {
        render(
            <WorkAppContext.Provider value={contextValue}>
                <MemoryRouter>
                    <ProjectsTable
                        projects={projects}
                        sortBy='name'
                        sortOrder='asc'
                        onSort={jest.fn()}
                    />
                </MemoryRouter>
            </WorkAppContext.Provider>,
        )
    }

    it('links the project name and open action to the challenges route', () => {
        renderTable([invitedProject])

        expect(screen.getByRole('link', { name: 'SK project1' })
            .getAttribute('href'))
            .toBe('/projects/100440/challenges')
        expect(screen.getByRole('link', { name: 'Open' })
            .getAttribute('href'))
            .toBe('/projects/100440/challenges')
    })

    it('shows project billing account spent totals and opens the line-item modal', () => {
        mockedUseFetchBillingAccounts.mockReturnValue({
            billingAccounts: [
                {
                    budget: 1000,
                    consumedBudget: 225,
                    id: 80001063,
                    lockedBudget: 125,
                    name: 'Access BA',
                    totalBudgetRemaining: 650,
                },
            ],
            error: undefined,
            isError: false,
            isLoading: false,
        })
        mockedUseFetchBillingAccountDetails.mockReturnValue({
            billingAccountDetails,
            error: undefined,
            isError: false,
            isLoading: false,
        })

        renderTable([{
            ...invitedProject,
            billingAccountId: 80001063,
        }])

        expect(screen.getAllByText('Access BA / 80001063').length)
            .toBeGreaterThan(0)
        expect(screen.getAllByText('$350 / $1,000 spent').length)
            .toBeGreaterThan(0)

        fireEvent.click(screen.getAllByRole('button', {
            name: 'View billing account details',
        })[0])

        expect(screen.getByRole('dialog')
            .textContent)
            .toContain('Billing account details for 80001063')
    })

    it('shows member payments remaining for copilot project rows', () => {
        mockedUseFetchBillingAccounts.mockReturnValue({
            billingAccounts: [
                {
                    budget: 1000,
                    consumedBudget: 225,
                    id: 80001063,
                    lockedBudget: 525,
                    markup: 0.8,
                    name: 'Access BA',
                    totalBudgetRemaining: 250,
                },
            ],
            error: undefined,
            isError: false,
            isLoading: false,
        })

        renderTable(
            [{
                ...invitedProject,
                billingAccountId: 80001063,
            }],
            {
                ...defaultContextValue,
                isCopilot: true,
                userRoles: ['copilot'],
            },
        )

        expect(screen.getAllByText('Member Payments Remaining: $200.00').length)
            .toBeGreaterThan(0)
        expect(screen.queryByText('$750 / $1,000 spent'))
            .toBeNull()
    })
})
