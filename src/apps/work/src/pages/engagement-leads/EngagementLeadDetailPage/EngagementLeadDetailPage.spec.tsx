/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import {
    EngagementLead,
    EngagementLeadStatus,
    EngagementLeadType,
} from '../../../lib/models/EngagementLead.model'
import { fetchEngagementLeadById } from '../../../lib/services/engagement-leads.service'

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
    Button: (props: { children?: React.ReactNode, onClick?: () => void }) => (
        <button onClick={props.onClick} type='button'>{props.children}</button>
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
    'Engagement Model',
    'Role Title',
    'Min Years Experience',
    'Commercial & Priority',
    'Client Bill Rate',
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
            billRateAmount: '100',
            billRateCurrency: 'USD',
            engagementModel: 'TIME_AND_MATERIAL',
            experienceLevel: 'SENIOR',
            minYearsExperience: 5,
            roleTitle: 'Backend Developer',
        })

        expect(screen.queryByText('Experience Level'))
            .not
            .toBeInTheDocument()

        const labels = [...SHARED_LABELS, ...CONSUMPTION_ONLY_LABELS]
        labels.forEach(label => {
            expect(screen.getByText(label))
                .toBeInTheDocument()
        })
        expect(screen.getByText('time and material'))
            .toBeInTheDocument()
        expect(screen.getByText('USD 100/hour'))
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
})
