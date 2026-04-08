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
        assignment?: { status?: string }
        engagement: { id: string; title: string }
        onAcceptOffer?: () => void
        profileGateError?: string
    }) => (
        <article data-testid={`assignment-card-${props.engagement.id}`}>
            <h2>{props.engagement.title}</h2>
            {props.assignment?.status?.toLowerCase() === 'selected' && (
                <button type='button' onClick={props.onAcceptOffer}>
                    Accept Offer
                </button>
            )}
            {props.profileGateError && <div>{props.profileGateError}</div>}
        </article>
    ),
    AssignmentOfferModal: () => <></>,
    EngagementsTabs: () => <div>engagement-tabs</div>,
    MemberExperienceModal: () => <></>,
    TermsAgreementModal: () => <></>,
}))

const buildEngagement = (
    id: string,
    title: string,
    assignmentStatus: string,
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
    status: EngagementStatus.OPEN,
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
})
