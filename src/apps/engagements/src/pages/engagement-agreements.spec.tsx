/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, sort-keys */
import '@testing-library/jest-dom'

import React, { act } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'react-toastify'

import type { Engagement, TermDetails } from '../lib/models'
import { EngagementStatus } from '../lib/models'
import {
    agreeToTerm,
    checkExistingApplication,
    createApplication,
    getDocuSignUrl,
    getEngagementByNanoId,
    getTermDetails,
    getUserDataForApplication,
    updateUserDataForApplication,
} from '../lib/services'
import {
    acceptAssignmentOffer,
    getMyAssignedEngagements,
    rejectAssignmentOffer,
} from '../lib/services/engagements.service'

import ApplicationFormPage from './application-form/ApplicationFormPage'
import EngagementDetailPage from './engagement-detail/EngagementDetailPage'
import MyAssignmentsPage from './my-assignments/MyAssignmentsPage'

const mockNavigate = jest.fn()
const mockUseProfileCompleteness = jest.fn()
const mockGetTermDetails = getTermDetails as jest.MockedFunction<typeof getTermDetails>
const mockAgreeToTerm = agreeToTerm as jest.MockedFunction<typeof agreeToTerm>
const mockGetDocuSignUrl = getDocuSignUrl as jest.MockedFunction<typeof getDocuSignUrl>
const mockGetEngagement = getEngagementByNanoId as jest.MockedFunction<typeof getEngagementByNanoId>
const mockCheckApplication = checkExistingApplication as jest.MockedFunction<typeof checkExistingApplication>
const mockCreateApplication = createApplication as jest.MockedFunction<typeof createApplication>
const mockGetUserData = getUserDataForApplication as jest.MockedFunction<typeof getUserDataForApplication>
const mockUpdateUserData = updateUserDataForApplication as jest.MockedFunction<typeof updateUserDataForApplication>
const mockGetAssignments = getMyAssignedEngagements as jest.MockedFunction<typeof getMyAssignedEngagements>
const mockAcceptOffer = acceptAssignmentOffer as jest.MockedFunction<typeof acceptAssignmentOffer>
const mockRejectOffer = rejectAssignmentOffer as jest.MockedFunction<typeof rejectAssignmentOffer>

jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useParams: () => ({ nanoId: 'eng-nano' }),
}))

jest.mock('react-toastify', () => ({
    toast: { error: jest.fn(), success: jest.fn() },
}))

jest.mock('react-markdown', () => ({
    __esModule: true,
    default: (props: { children: React.ReactNode }) => <div>{props.children}</div>,
}))
jest.mock('rehype-raw', () => () => undefined)
jest.mock('remark-breaks', () => () => undefined)
jest.mock('remark-frontmatter', () => () => undefined)
jest.mock('remark-gfm', () => () => undefined)

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        DEFAULT_STANDARD_TERMS_UUID: 'standard-terms',
        TERMS_URL: 'https://example.com/terms/standard-terms',
        NDA_TERMS_URL: 'https://example.com/terms/nda',
        TC_DOMAIN: 'topcoder.com',
        URLS: { USER_PROFILE: 'https://topcoder.com/members' },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    authUrlLogin: () => '/login',
    tokenGetAsync: jest.fn()
        .mockResolvedValue({ handle: 'member' }),
    useProfileContext: () => ({
        initialized: true,
        isLoggedIn: true,
        profile: { handle: 'member', userId: 123, roles: ['Member'] },
    }),
    useProfileCompleteness: () => mockUseProfileCompleteness(),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: {
        open: boolean
        title: string
        children: React.ReactNode
        buttons: React.ReactNode
    }) => (props.open ? (
        <div role='dialog' aria-label={props.title}>
            {props.children}
            {props.buttons}
        </div>
    ) : <></>),
    Button: (props: {
        disabled?: boolean
        label: React.ReactNode
        onClick?: () => void
        type?: 'button' | 'submit'
    }) => (
        <button type={props.type === 'submit' ? 'submit' : 'button'} disabled={props.disabled} onClick={props.onClick}>
            {props.label}
        </button>
    ),
    ContentLayout: (props: { children: React.ReactNode; title: string }) => (
        <div>
            <h1>{props.title}</h1>
            {props.children}
        </div>
    ),
    IconOutline: {
        ExclamationIcon: () => <span />,
        InformationCircleIcon: () => <span />,
        SearchIcon: () => <span />,
        CheckCircleIcon: () => <span />,
        ClockIcon: () => <span />,
    },
    IconSolid: {
        BriefcaseIcon: () => <span />,
        CalendarIcon: () => <span />,
        ClockIcon: () => <span />,
        CurrencyDollarIcon: () => <span />,
        GlobeAltIcon: () => <span />,
        LocationMarkerIcon: () => <span />,
    },
    LoadingSpinner: () => <div>loading-spinner</div>,
}), { virtual: true })

jest.mock('~/apps/admin/src/lib/components/common/Pagination', () => ({
    Pagination: () => <></>,
}), { virtual: true })

jest.mock('../lib', () => jest.requireActual('../lib/hooks/useTermsAgreementGate'))

jest.mock('../lib/services', () => ({
    agreeToTerm: jest.fn(),
    checkExistingApplication: jest.fn(),
    createApplication: jest.fn(),
    getDocuSignUrl: jest.fn(),
    getEngagementByNanoId: jest.fn(),
    getTermDetails: jest.fn(),
    getUserDataForApplication: jest.fn(),
    updateUserDataForApplication: jest.fn(),
}))

jest.mock('../lib/services/engagements.service', () => ({
    acceptAssignmentOffer: jest.fn(),
    getMyAssignedEngagements: jest.fn(),
    rejectAssignmentOffer: jest.fn(),
}))

jest.mock('../engagements.routes', () => ({ rootRoute: '/engagements' }))

jest.mock('../components', () => ({
    AssignmentCard: (props: {
        onAcceptOffer?: () => void
        onRejectOffer?: () => void
    }) => (
        <article>
            <button type='button' onClick={props.onAcceptOffer}>Accept Offer</button>
            <button type='button' onClick={props.onRejectOffer}>Reject Offer</button>
        </article>
    ),
    AssignmentOfferModal: jest.requireActual('../components/assignment-offer-modal/AssignmentOfferModal').default,
    TermsAgreementModal: jest.requireActual('../components/terms-agreement-modal/TermsAgreementModal').default,
    EngagementsTabs: () => <></>,
    MemberExperienceModal: () => <></>,
    StatusBadge: () => <></>,
}))

const engagement: Engagement = {
    id: 'eng-1',
    nanoId: 'eng-nano',
    projectId: 'project-1',
    title: 'Example Engagement',
    description: 'Engagement description',
    duration: {},
    timeZones: [],
    countries: [],
    requiredSkills: [],
    status: EngagementStatus.OPEN,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    createdBy: 'manager',
    assignments: [{
        id: 'assignment-1',
        engagementId: 'eng-1',
        memberId: '123',
        memberHandle: 'member',
        status: 'selected',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
    }],
}

let terms: Record<string, TermDetails>

describe('engagement agreement timing', () => {
    beforeEach(() => {
        jest.resetAllMocks()
        terms = {
            'standard-terms': {
                id: 'standard-terms',
                title: 'Standard Topcoder Terms',
                agreed: false,
                agreeabilityType: 'Electronically-agreeable',
            },
            nda: { id: 'nda', title: 'Topcoder NDA', agreed: false, agreeabilityType: 'Electronically-agreeable' },
        }
        mockGetTermDetails.mockImplementation(async id => ({ ...terms[id] }))
        mockAgreeToTerm.mockImplementation(async id => {
            terms[id].agreed = true
            return { success: true }
        })
        mockUseProfileCompleteness.mockReturnValue({ isLoading: false, percent: 100 })
        mockGetEngagement.mockResolvedValue(engagement)
        mockCheckApplication.mockResolvedValue({ hasApplied: false })
        mockGetUserData.mockResolvedValue({
            name: 'Example Member', email: 'member@example.com', mobileNumber: '+12345',
        })
        mockGetAssignments.mockResolvedValue({ data: [engagement], page: 1, perPage: 20, total: 1, totalPages: 1 })
    })

    it.each(['unsigned', 'unavailable'])('opens the application without checking %s agreements', async state => {
        if (state === 'unavailable') {
            mockGetTermDetails.mockRejectedValue(new Error('Terms API unavailable'))
        }

        const user = userEvent.setup()
        await act(async () => { render(<EngagementDetailPage />) })
        await user.click(await screen.findByRole('button', { name: 'Apply Now' }))

        expect(mockNavigate)
            .toHaveBeenCalledWith('/engagements/eng-nano/apply')
        expect(mockGetTermDetails).not.toHaveBeenCalled()
        expect(mockAgreeToTerm).not.toHaveBeenCalled()
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('allows applying when profile is not 100% complete', async () => {
        mockUseProfileCompleteness.mockReturnValue({ isLoading: false, percent: 80 })
        const user = userEvent.setup()
        await act(async () => { render(<EngagementDetailPage />) })
        await user.click(await screen.findByRole('button', { name: 'Apply Now' }))

        expect(mockNavigate)
            .toHaveBeenCalledWith('/engagements/eng-nano/apply')
        expect(mockGetTermDetails).not.toHaveBeenCalled()
    })

    it.each(['unsigned', 'unavailable'])('submits a direct application with %s agreements', async state => {
        if (state === 'unavailable') {
            mockGetTermDetails.mockRejectedValue(new Error('Terms API unavailable'))
        }

        const user = userEvent.setup()
        render(<ApplicationFormPage />)
        await user.type(await screen.findByLabelText(/Cover Letter/), 'I would like to apply for this engagement.')
        await user.click(screen.getByRole('button', { name: 'Submit Application' }))

        await waitFor(() => expect(mockCreateApplication)
            .toHaveBeenCalledWith('eng-1', expect.objectContaining({
                coverLetter: 'I would like to apply for this engagement.',
                mobileNumber: '+12345',
            })))
        expect(mockUpdateUserData)
            .toHaveBeenCalled()
        expect(mockNavigate)
            .toHaveBeenCalledWith('/my-applications')
        expect(mockGetTermDetails).not.toHaveBeenCalled()
        expect(mockAgreeToTerm).not.toHaveBeenCalled()
        expect(screen.queryByText('Terms Status')).not.toBeInTheDocument()
    })

    it.each([false, true])('requires both agreements before confirming an offer (private: %s)', async isPrivate => {
        mockGetAssignments.mockResolvedValue({
            data: [{ ...engagement, isPrivate }], page: 1, perPage: 20, total: 1, totalPages: 1,
        })
        const user = userEvent.setup()
        render(<MyAssignmentsPage />)
        await user.click(await screen.findByRole('button', { name: 'Accept Offer' }))

        const standardDialog = await screen.findByRole('dialog', { name: 'Standard Topcoder Terms' })
        expect(mockAcceptOffer).not.toHaveBeenCalled()
        expect(screen.queryByRole('dialog', { name: 'Accept Offer' })).not.toBeInTheDocument()
        await user.click(within(standardDialog)
            .getByRole('button', { name: 'I Agree' }))

        const ndaDialog = await screen.findByRole('dialog', { name: 'Topcoder NDA' })
        expect(mockAcceptOffer).not.toHaveBeenCalled()
        expect(screen.queryByRole('dialog', { name: 'Accept Offer' })).not.toBeInTheDocument()
        await user.click(within(ndaDialog)
            .getByRole('button', { name: 'I Agree' }))

        const offerDialog = await screen.findByRole('dialog', { name: 'Accept Offer' })
        expect(mockAgreeToTerm.mock.calls)
            .toEqual([['standard-terms'], ['nda']])
        expect(mockAcceptOffer).not.toHaveBeenCalled()
        await user.click(within(offerDialog)
            .getByRole('button', { name: 'Accept Offer' }))
        expect(mockAcceptOffer)
            .toHaveBeenCalledWith('eng-1', 'assignment-1')
    })

    it('skips agreements already signed when accepting an offer', async () => {
        terms['standard-terms'].agreed = true
        terms.nda.agreed = true
        const user = userEvent.setup()
        render(<MyAssignmentsPage />)
        await user.click(await screen.findByRole('button', { name: 'Accept Offer' }))

        const offerDialog = await screen.findByRole('dialog', { name: 'Accept Offer' })
        expect(mockGetTermDetails)
            .toHaveBeenCalledWith('standard-terms')
        expect(mockGetTermDetails)
            .toHaveBeenCalledWith('nda')
        expect(mockAgreeToTerm).not.toHaveBeenCalled()
        await user.click(within(offerDialog)
            .getByRole('button', { name: 'Accept Offer' }))
        expect(mockAcceptOffer)
            .toHaveBeenCalledWith('eng-1', 'assignment-1')
    })

    it('keeps acceptance blocked when the terms lookup fails', async () => {
        mockGetTermDetails.mockRejectedValue(new Error('Terms API unavailable'))
        const user = userEvent.setup()
        render(<MyAssignmentsPage />)
        await user.click(await screen.findByRole('button', { name: 'Accept Offer' }))

        await waitFor(() => expect(toast.error)
            .toHaveBeenCalledWith('Unable to verify terms of use. Please try again.'))
        expect(screen.queryByRole('dialog', { name: 'Accept Offer' })).not.toBeInTheDocument()
        expect(mockAcceptOffer).not.toHaveBeenCalled()
    })

    it('keeps acceptance blocked when the member declines an agreement', async () => {
        const user = userEvent.setup()
        render(<MyAssignmentsPage />)
        await user.click(await screen.findByRole('button', { name: 'Accept Offer' }))
        const dialog = await screen.findByRole('dialog', { name: 'Standard Topcoder Terms' })
        await user.click(within(dialog)
            .getByRole('button', { name: 'I Disagree' }))

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(mockAgreeToTerm).not.toHaveBeenCalled()
        expect(mockAcceptOffer).not.toHaveBeenCalled()
    })

    it('allows rejecting an offer without checking or signing agreements', async () => {
        mockGetTermDetails.mockRejectedValue(new Error('Terms API unavailable'))
        const user = userEvent.setup()
        render(<MyAssignmentsPage />)
        await user.click(await screen.findByRole('button', { name: 'Reject Offer' }))
        const dialog = await screen.findByRole('dialog', { name: 'Reject Offer' })
        await user.click(within(dialog)
            .getByRole('button', { name: 'Reject Offer' }))

        expect(mockRejectOffer)
            .toHaveBeenCalledWith('eng-1', 'assignment-1')
        expect(mockGetTermDetails).not.toHaveBeenCalled()
        expect(mockAgreeToTerm).not.toHaveBeenCalled()
    })

    it('waits for Terms API confirmation of a DocuSign NDA before offering acceptance', async () => {
        const addEventListener = jest.spyOn(window, 'addEventListener')
        terms['standard-terms'].agreed = true
        terms.nda.agreeabilityType = 'DocuSignable'
        terms.nda.docusignTemplateId = 'nda-template'
        mockGetDocuSignUrl.mockResolvedValue('https://example.com/sign-nda')
        const user = userEvent.setup()
        render(<MyAssignmentsPage />)
        await user.click(await screen.findByRole('button', { name: 'Accept Offer' }))
        expect(await screen.findByTitle('Topcoder NDA'))
            .toHaveAttribute('src', 'https://example.com/sign-nda')
        expect(mockGetDocuSignUrl)
            .toHaveBeenCalledWith('nda-template', expect.stringContaining('docusignReturn=1'))
        expect(screen.queryByRole('dialog', { name: 'Accept Offer' })).not.toBeInTheDocument()
        expect(mockAcceptOffer).not.toHaveBeenCalled()

        terms.nda.agreed = true
        mockGetTermDetails.mockClear()
        await waitFor(() => expect(addEventListener)
            .toHaveBeenCalledWith('message', expect.any(Function)))
        fireEvent(window, new MessageEvent('message', { data: { type: 'DocuSign', event: 'signing_complete' } }))

        const dialog = await screen.findByRole('dialog', { name: 'Accept Offer' })
        expect(mockGetTermDetails)
            .toHaveBeenCalledWith('nda')
        expect(mockAgreeToTerm).not.toHaveBeenCalled()
        expect(mockAcceptOffer).not.toHaveBeenCalled()
        await user.click(within(dialog)
            .getByRole('button', { name: 'Accept Offer' }))
        expect(mockAcceptOffer)
            .toHaveBeenCalledWith('eng-1', 'assignment-1')
        addEventListener.mockRestore()
    })
})
