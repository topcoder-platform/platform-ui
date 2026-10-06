/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import { ReactNode } from 'react'

import OpportunityModal from './OpportunityModal'
import { fetchOpportunity, SalesOpportunity } from './opportunity.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: { URLS: { WORK_APP: 'https://work.topcoder-dev.com/' } },
}), { virtual: true })

jest.mock('./opportunity.service', () => ({
    fetchOpportunity: jest.fn(),
    opportunityErrorMessage: () => 'Unable to load opportunity details.',
}))

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: { children: ReactNode; open: boolean; title: ReactNode }) => (
        props.open ? (
            <div role='dialog'>
                <h2>{props.title}</h2>
                {props.children}
            </div>
        ) : undefined
    ),
    Button: () => <button type='button'>Close</button>,
    LoadingSpinner: () => <span>Loading</span>,
}), { virtual: true })

const fetchDetails = fetchOpportunity as jest.MockedFunction<typeof fetchOpportunity>
const opportunity: SalesOpportunity = {
    billingAccount: { id: '22', name: 'Current contract' },
    description: 'Example description',
    id: '006UN00000XamntYAB',
    name: 'Example opportunity',
    projectId: '123',
    relatedBillingAccounts: [
        { id: '3', name: 'Original contract' },
        { id: '11', name: 'Extension' },
        { id: '22', name: 'Current contract' },
        { id: '99' },
    ],
    url: 'https://topcoder.my.salesforce.com/006UN00000XamntYAB',
}

/**
 * Opens the popup with a mocked opportunity response for billing behavior tests.
 * @param details Opportunity data, including nullable or absent billing context.
 * @returns Resolves after the opportunity has loaded in the rendered modal.
 * @throws Testing Library errors if the expected description does not render.
 */
async function openOpportunity(details: SalesOpportunity): Promise<void> {
    fetchDetails.mockResolvedValue(details)
    render(<OpportunityModal
        onClose={jest.fn()}
        open
        opportunityId={details.id}
        opportunityName={details.name}
    />)
    await screen.findByText('Example description')
}

describe('OpportunityModal billing context', () => {
    beforeEach(() => jest.clearAllMocks())

    it('shows the current account, Work challenges link, and only past accounts in the list', async () => {
        await openOpportunity(opportunity)
        expect(screen.getByText('Current contract'))
            .toBeInTheDocument()
        expect(screen.getByText('ID: 22'))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'View project 123 in Work' }))
            .toHaveAttribute('href', 'https://work.topcoder-dev.com/projects/123/challenges')
        expect(screen.getByRole('link', { name: 'View project 123 in Work' }))
            .toHaveAttribute('rel', 'noopener noreferrer')
        const list = screen.getByRole('list')
        expect(within(list)
            .getAllByRole('listitem'))
            .toHaveLength(3)
        expect(within(list)
            .getByText('Original contract'))
            .toBeInTheDocument()
        expect(within(list)
            .getByText('Extension'))
            .toBeInTheDocument()
        expect(within(list)
            .getByText('Name unavailable'))
            .toBeInTheDocument()
        expect(within(list)
            .getByText('ID: 99'))
            .toBeInTheDocument()
        expect(within(list)
            .queryByText('Current contract')).not.toBeInTheDocument()
    })

    // The API sends JSON null, while older responses omit the new field.
    // eslint-disable-next-line unicorn/no-null
    it.each([null, undefined])('hides every new field without an associated billing account (%s)', async account => {
        await openOpportunity({ ...opportunity, billingAccount: account })
        expect(screen.queryByText('Current billing account')).not.toBeInTheDocument()
        expect(screen.queryByText('Past billing accounts')).not.toBeInTheDocument()
        expect(screen.queryByText('Work project')).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: /in Work/ })).not.toBeInTheDocument()
        expect(screen.queryByRole('list')).not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'View in Salesforce' }))
            .toBeInTheDocument()
    })

    it('keeps the account visible when no matching project exists', async () => {
        // eslint-disable-next-line unicorn/no-null -- The API sends a null project ID when no project matches.
        await openOpportunity({ ...opportunity, projectId: null, relatedBillingAccounts: [] })
        expect(screen.getByText('ID: 22'))
            .toBeInTheDocument()
        expect(screen.queryByRole('link', { name: /in Work/ })).not.toBeInTheDocument()
        expect(screen.getByText('No past billing accounts found.'))
            .toBeInTheDocument()
    })

    it('shows an empty past list when only the current account was used by challenges', async () => {
        await openOpportunity({ ...opportunity, relatedBillingAccounts: [{ id: '22', name: 'Current contract' }] })
        expect(screen.getAllByText('Current contract'))
            .toHaveLength(1)
        expect(screen.getByText('No past billing accounts found.'))
            .toBeInTheDocument()
    })

    it('does not construct a Work link for an invalid project ID', async () => {
        await openOpportunity({ ...opportunity, projectId: '../other' })
        expect(screen.queryByRole('link', { name: /in Work/ })).not.toBeInTheDocument()
    })
})
