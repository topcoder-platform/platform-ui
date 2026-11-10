/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import {
    EngagementLead,
    EngagementLeadStatus,
    EngagementLeadType,
} from '../../../lib/models/EngagementLead.model'
import {
    fetchEngagementLeadById,
    updateEngagementLeadStatus,
} from '../../../lib/services/engagement-leads.service'

import { EngagementLeadDetailPage } from './EngagementLeadDetailPage'

jest.mock('~/apps/review/src/lib', () => ({
    PageWrapper: (props: { children?: React.ReactNode, pageTitle: string }) => (
        <div>
            <h1>{props.pageTitle}</h1>
            {props.children}
        </div>
    ),
}), { virtual: true })
jest.mock('~/libs/ui', () => ({
    Button: (props: {
        children?: React.ReactNode
        disabled?: boolean
        label?: string
        onClick?: () => void
    }) => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
            {props.children ?? props.label}
        </button>
    ),
}), { virtual: true })
jest.mock('../../../config/routes.config', () => ({
    rootRoute: '/work',
}))
jest.mock('../../../lib/components', () => ({
    ErrorMessage: (props: { message: string }) => <div>{props.message}</div>,
    LoadingSpinner: () => <div>Loading</div>,
}))
jest.mock('../../../lib/utils', () => ({
    extractErrorMessage: (_err: unknown, fallback: string): string => fallback,
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))
jest.mock('../../../lib/services/engagement-leads.service', () => ({
    fetchEngagementLeadById: jest.fn(),
    updateEngagementLeadStatus: jest.fn(),
}))
jest.mock('../../../lib/utils/navigation.utils', () => ({
    withQueryParams: (url: string): string => url,
}))
jest.mock('../../../lib/services/engagements.service', () => ({
    fetchEngagement: jest.fn(),
}))

const mockFetchLead = fetchEngagementLeadById as jest.MockedFunction<typeof fetchEngagementLeadById>
const mockUpdateStatus = updateEngagementLeadStatus as jest.MockedFunction<typeof updateEngagementLeadStatus>

const baseLead: EngagementLead = {
    accountName: 'ABC Bank',
    createdAt: '2026-10-28T00:00:00.000Z',
    engagementDuration: '6 months',
    id: 'lead-1',
    jobDescription: 'Build the product.',
    leadType: EngagementLeadType.WIPRO_CONSUMPTION,
    remoteWorkAccepted: true,
    requiredSkills: ['React'],
    resourcesRequired: 2,
    smu: 'AMR1',
    status: EngagementLeadStatus.SUBMITTED,
    timeZoneRequirement: 'IST',
    updatedAt: '2026-10-28T00:00:00.000Z',
    workEmail: 'jane.doe@wipro.com',
    workingHoursPerDay: 8,
}

const CONSUMPTION_ONLY_LABELS = [
    'Role Title',
    'Min Years Experience',
    'Commercials',
    'Maximum Cost',
]

const SHARED_LABELS = [
    'Work Email (SPOC)',
    'Account / Customer',
    'SMU',
    'Job Description',
    'Required Skills',
    'Resources Required',
    'Preferred Start Date',
    'Duration',
    'Working Hours / Day',
    'Time Zone',
    'Remote Accepted',
    'Location Restrictions',
]

async function renderLead(lead: EngagementLead): Promise<void> {
    mockFetchLead.mockResolvedValue(lead)

    render(
        <MemoryRouter initialEntries={['/engagement-leads/lead-1']}>
            <Routes>
                <Route path='/engagement-leads/:leadId' element={<EngagementLeadDetailPage />} />
            </Routes>
        </MemoryRouter>,
    )

    await screen.findByText('Contact & Account')
}

describe('EngagementLeadDetailPage', () => {
    it('shows every Wipro Consumption form field', async () => {
        await renderLead({
            ...baseLead,
            experienceLevel: 'SENIOR',
            maximumCost: 'USD 100/hour',
            minYearsExperience: 5,
            roleTitle: 'Backend Developer',
        })

        const removedLabels = ['Experience Level', 'Engagement Model', 'Client Bill Rate', 'Commercial & Priority']
        removedLabels.forEach(label => {
            expect(screen.queryByText(label))
                .not
                .toBeInTheDocument()
        })

        const labels = [...SHARED_LABELS, ...CONSUMPTION_ONLY_LABELS]
        labels.forEach(label => {
            expect(screen.getByText(label))
                .toBeInTheDocument()
        })
        expect(screen.getByText('USD 100/hour'))
            .toBeInTheDocument()
    })

    it('still shows the engagement model and bill rate of older consumption leads', async () => {
        await renderLead({
            ...baseLead,
            billRateAmount: '90',
            billRateCurrency: 'USD',
            engagementModel: 'TIME_AND_MATERIAL',
            roleTitle: 'Backend Developer',
        })

        expect(screen.getByText('time and material'))
            .toBeInTheDocument()
        expect(screen.getByText('USD 90/hour'))
            .toBeInTheDocument()
    })

    it('shows only the Wipro Direct form fields', async () => {
        await renderLead({ ...baseLead, leadType: EngagementLeadType.WIPRO_DIRECT })

        SHARED_LABELS.forEach(label => {
            expect(screen.getByText(label))
                .toBeInTheDocument()
        })
        CONSUMPTION_ONLY_LABELS.forEach(label => {
            expect(screen.queryByText(label))
                .not
                .toBeInTheDocument()
        })
    })

    it('asks for a reason before rejecting a lead', async () => {
        mockUpdateStatus.mockResolvedValue({
            ...baseLead,
            rejectionReason: 'Budget was cut.',
            status: EngagementLeadStatus.REJECTED,
        })
        await renderLead(baseLead)

        await userEvent.click(screen.getByRole('button', { name: 'Mark Lost' }))

        const dialog = screen.getByRole('dialog')
        const confirm = within(dialog)
            .getByRole('button', { name: 'Mark Lost' })
        expect(confirm)
            .toBeDisabled()
        expect(mockUpdateStatus)
            .not
            .toHaveBeenCalled()

        await userEvent.type(within(dialog)
            .getByLabelText('Rejection reason'), 'Budget was cut.')
        await userEvent.click(confirm)

        await waitFor(() => expect(mockUpdateStatus)
            .toHaveBeenCalledWith('lead-1', EngagementLeadStatus.REJECTED, 'Budget was cut.'))
        expect(await screen.findByText('Rejection Reason'))
            .toBeInTheDocument()
        expect(screen.getByText('Budget was cut.'))
            .toBeInTheDocument()
        expect(screen.queryByRole('dialog'))
            .toBeNull()
    })
})
