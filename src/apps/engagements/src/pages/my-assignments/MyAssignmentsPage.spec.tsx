/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, sort-keys */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { Engagement } from '../../lib/models'
import { EngagementStatus } from '../../lib/models'
import { getMyAssignedEngagements } from '../../lib/services/engagements.service'

import MyAssignmentsPage from './MyAssignmentsPage'

const mockNavigate = jest.fn()
const mockUseProfileContext = jest.fn()
const mockUseProfileCompleteness = jest.fn()
const mockGetMyAssignedEngagements = getMyAssignedEngagements as jest.MockedFunction<
    typeof getMyAssignedEngagements
>

jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}))

jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}))

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        TC_DOMAIN: 'topcoder.com',
        URLS: {
            USER_PROFILE: 'https://topcoder.com/members',
        },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    useProfileContext: () => mockUseProfileContext(),
    useProfileCompleteness: () => mockUseProfileCompleteness(),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
    }) => (
        <button type='button' disabled={props.disabled} onClick={props.onClick}>
            {props.label}
        </button>
    ),
    ContentLayout: (props: {
        children: React.ReactNode
        title: string
    }) => (
        <div>
            <h1>{props.title}</h1>
            {props.children}
        </div>
    ),
    IconOutline: {
        ExclamationIcon: () => <span>error-icon</span>,
        SearchIcon: () => <span>search-icon</span>,
    },
    LoadingSpinner: () => <div>loading-spinner</div>,
}), { virtual: true })

jest.mock('~/apps/admin/src/lib/components/common/Pagination', () => ({
    Pagination: () => <div>pagination</div>,
}), { virtual: true })

jest.mock('../../lib', () => ({
    useTermsAgreementGate: () => ({
        modalState: {
            open: false,
        },
        startTermsAgreementFlow: jest.fn(),
        termsError: undefined,
    }),
}))

jest.mock('../../lib/services/engagements.service', () => ({
    acceptAssignmentOffer: jest.fn(),
    getMyAssignedEngagements: jest.fn(),
    rejectAssignmentOffer: jest.fn(),
}))

jest.mock('../../engagements.routes', () => ({
    rootRoute: '/engagements',
}))

jest.mock('../../components', () => ({
    AssignmentCard: (props: {
        assignment?: { id: string; status?: string }
        engagement: { id: string; title: string }
        onAcceptOffer?: () => void
        onDocumentExperience?: () => void
        onOpenTimesheet?: () => void
        profileGateError?: string
    }) => (
        <article data-testid={`assignment-card-${props.engagement.id}`}>
            <h2>{props.engagement.title}</h2>
            <span>{props.assignment?.status}</span>
            {props.assignment?.status?.toLowerCase() === 'selected' && (
                <button type='button' onClick={props.onAcceptOffer}>
                    Accept Offer
                </button>
            )}
            {props.assignment?.status?.toLowerCase() === 'assigned' && props.onOpenTimesheet && (
                <button type='button' onClick={props.onOpenTimesheet}>
                    Timesheet
                </button>
            )}
            <button type='button' onClick={props.onDocumentExperience}>
                Document Experience
            </button>
            {props.profileGateError && <div>{props.profileGateError}</div>}
        </article>
    ),
    AssignmentOfferModal: () => <></>,
    EngagementsTabs: () => <div>engagement-tabs</div>,
    MemberExperienceModal: (props: { assignmentId: string; open: boolean; onClose: () => void }) => (
        props.open ? (
            <div role='dialog' aria-label='Document Your Experience'>
                <span>{props.assignmentId}</span>
                <button type='button' onClick={props.onClose}>Close</button>
            </div>
        ) : <></>
    ),
    TermsAgreementModal: () => <></>,
}))

/**
 * Builds an engagement with one member assignment for page regression tests.
 * @param id Engagement id used to derive fixture ids.
 * @param title Display title.
 * @param assignmentStatus Status of the member's assignment.
 * @param engagementStatus Overall engagement status, defaulting to open.
 * @returns An engagement fixture owned by the mocked signed-in member.
 * @throws Does not throw.
 */
const buildEngagement = (
    id: string,
    title: string,
    assignmentStatus: string,
    engagementStatus: EngagementStatus = EngagementStatus.OPEN,
): Engagement => ({
    id,
    nanoId: `${id}-nano`,
    projectId: `${id}-project`,
    title,
    description: `${title} description`,
    duration: {},
    timeZones: [],
    countries: [],
    requiredSkills: [],
    status: engagementStatus,
    createdAt: '2026-03-25T00:00:00.000Z',
    updatedAt: '2026-03-25T00:00:00.000Z',
    createdBy: 'talent-manager',
    assignments: [
        {
            id: `${id}-assignment`,
            engagementId: id,
            memberId: '123',
            memberHandle: 'incomplete-member',
            status: assignmentStatus,
            createdAt: '2026-03-25T00:00:00.000Z',
            updatedAt: '2026-03-25T00:00:00.000Z',
        },
    ],
})

describe('MyAssignmentsPage', () => {
    beforeEach(() => {
        mockNavigate.mockReset()
        mockUseProfileContext.mockReturnValue({
            isLoggedIn: true,
            profile: {
                handle: 'incomplete-member',
                userId: 123,
            },
        })
        mockUseProfileCompleteness.mockReturnValue({
            isLoading: false,
            percent: 80,
        })
        mockGetMyAssignedEngagements.mockResolvedValue({
            data: [
                buildEngagement('eng-1', 'Private Engagement 1', 'selected'),
                buildEngagement('eng-2', 'Private Engagement 2', 'assigned'),
            ],
            page: 1,
            perPage: 20,
            total: 2,
            totalPages: 1,
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('shows the incomplete profile message only on the selected card where accept was clicked', async () => {
        const user = userEvent.setup()

        render(<MyAssignmentsPage />)

        const acceptOfferButton = await screen.findByRole('button', { name: 'Accept Offer' })

        await user.click(acceptOfferButton)

        const firstCard = screen.getByTestId('assignment-card-eng-1')
        const secondCard = screen.getByTestId('assignment-card-eng-2')
        const gateMessage = 'Your profile must be 100% complete before accepting this offer.'

        expect(within(firstCard)
            .getByText(gateMessage))
            .toBeInTheDocument()
        expect(within(secondCard)
            .queryByText(gateMessage))
            .not.toBeInTheDocument()
        expect(screen.getAllByText(gateMessage))
            .toHaveLength(1)
    })

    it('groups selected and assigned assignments before completed and terminated assignments', async () => {
        mockGetMyAssignedEngagements.mockResolvedValue({
            data: [
                buildEngagement('eng-completed', 'Completed Engagement', 'completed'),
                buildEngagement('eng-selected', 'Selected Engagement', 'selected'),
                buildEngagement('eng-terminated', 'Terminated Engagement', 'terminated'),
                buildEngagement('eng-assigned', 'Assigned Engagement', 'assigned'),
            ],
            page: 1,
            perPage: 20,
            total: 4,
            totalPages: 1,
        })

        render(<MyAssignmentsPage />)

        const activeHeading = await screen.findByRole('heading', { name: 'Active' })
        const pastHeading = screen.getByRole('heading', { name: 'Past' })
        const activeSection = activeHeading.closest('section') as HTMLElement
        const pastSection = pastHeading.closest('section') as HTMLElement

        const headingLabels = screen.getAllByRole('heading')
            .map(heading => heading.textContent)

        expect(headingLabels.indexOf('Active'))
            .toBeLessThan(headingLabels.indexOf('Past'))
        expect(within(activeSection)
            .getByText('Selected Engagement'))
            .toBeInTheDocument()
        expect(within(activeSection)
            .getByText('Assigned Engagement'))
            .toBeInTheDocument()
        expect(within(activeSection)
            .queryByText('Completed Engagement'))
            .not.toBeInTheDocument()
        expect(within(activeSection)
            .queryByText('Terminated Engagement'))
            .not.toBeInTheDocument()
        expect(within(pastSection)
            .getByText('Completed Engagement'))
            .toBeInTheDocument()
        expect(within(pastSection)
            .getByText('Terminated Engagement'))
            .toBeInTheDocument()
    })

    it.each(['completed', 'terminated'])(
        'keeps a %s assignment accessible when the same member has an active assignment',
        async pastStatus => {
            const user = userEvent.setup()
            const engagement = buildEngagement('eng-repeat', 'Repeated Engagement', pastStatus)
            const pastAssignment = engagement.assignments![0]
            const activeAssignment = {
                ...pastAssignment,
                id: 'active-assignment',
                status: 'assigned',
            }
            engagement.assignments = [
                activeAssignment,
                pastAssignment,
                { ...pastAssignment, id: 'other-member-assignment', memberId: '456' },
            ]
            mockGetMyAssignedEngagements.mockResolvedValue({
                data: [engagement],
                page: 1,
                perPage: 20,
                total: 1,
                totalPages: 1,
            })

            render(<MyAssignmentsPage />)

            const pastHeading = await screen.findByRole('heading', { name: 'Past' })
            const activeHeading = screen.getByRole('heading', { name: 'Active' })
            const pastSection = within(pastHeading.closest('section') as HTMLElement)
            const activeSection = within(activeHeading.closest('section') as HTMLElement)

            expect(screen.getAllByRole('article'))
                .toHaveLength(2)
            expect(pastSection.getByText(pastStatus))
                .toBeInTheDocument()
            expect(activeSection.getByText('assigned'))
                .toBeInTheDocument()

            await user.click(pastSection.getByRole('button', { name: 'Document Experience' }))
            expect(within(screen.getByRole('dialog'))
                .getByText(pastAssignment.id))
                .toBeInTheDocument()

            await user.click(screen.getByRole('button', { name: 'Close' }))
            await user.click(activeSection.getByRole('button', { name: 'Document Experience' }))
            expect(within(screen.getByRole('dialog'))
                .getByText(activeAssignment.id))
                .toBeInTheDocument()
        },
    )

    describe('timesheet entry point', () => {
        it('shows a Timesheet button for an assigned engagement and opens the nested route', async () => {
            const user = userEvent.setup()
            mockGetMyAssignedEngagements.mockResolvedValue({
                data: [
                    buildEngagement(
                        'eng-assigned',
                        'Assigned Engagement',
                        'assigned',
                        EngagementStatus.ACTIVE,
                    ),
                ],
                page: 1,
                perPage: 20,
                total: 1,
                totalPages: 1,
            })

            render(<MyAssignmentsPage />)

            const timesheetButton = await screen.findByRole('button', { name: 'Timesheet' })
            await user.click(timesheetButton)

            // Both ids live in the path, so the page loads the timesheet without resolving anything.
            expect(mockNavigate)
                .toHaveBeenCalledWith(
                    '/engagements/eng-assigned/timesheets/eng-assigned-assignment',
                )
        })

        it('shows no Timesheet button while the assignment is only an unaccepted offer', async () => {
            mockGetMyAssignedEngagements.mockResolvedValue({
                data: [
                    buildEngagement(
                        'eng-selected',
                        'Selected Engagement',
                        'selected',
                        EngagementStatus.ACTIVE,
                    ),
                ],
                page: 1,
                perPage: 20,
                total: 1,
                totalPages: 1,
            })

            render(<MyAssignmentsPage />)

            await screen.findByText('Selected Engagement')

            expect(screen.queryByRole('button', { name: 'Timesheet' }))
                .not
                .toBeInTheDocument()
        })
    })
})
