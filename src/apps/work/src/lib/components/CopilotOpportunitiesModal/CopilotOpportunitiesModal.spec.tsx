/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'

import CopilotOpportunitiesModal from './CopilotOpportunitiesModal'

const mockUseFetchProjectCopilotOpportunities = jest.fn()

jest.mock('../../hooks', () => ({
    useFetchProjectCopilotOpportunities: (...args: unknown[]): unknown => (
        mockUseFetchProjectCopilotOpportunities(...args)
    ),
}))

jest.mock('../../constants', () => ({
    COPILOTS_APP_URL: 'https://copilots.example.com',
}))

jest.mock('~/libs/ui', () => ({
    LoadingSpinner: (): JSX.Element => <div>Loading</div>,
}), {
    virtual: true,
})

describe('CopilotOpportunitiesModal', () => {
    beforeEach(() => {
        mockUseFetchProjectCopilotOpportunities.mockReset()
    })

    it('links every opportunity created for the project to the Copilots app', () => {
        mockUseFetchProjectCopilotOpportunities.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            opportunities: [
                {
                    createdAt: '2026-09-01T10:00:00.000Z',
                    id: '17',
                    opportunityTitle: 'Metro Onboarding Copilot',
                    projectId: '200',
                    status: 'active',
                },
                {
                    createdAt: '2026-08-20T10:00:00.000Z',
                    id: '12',
                    projectId: '200',
                    status: 'completed',
                },
            ],
        })

        render(<CopilotOpportunitiesModal onClose={jest.fn()} projectId='200' />)

        expect(mockUseFetchProjectCopilotOpportunities)
            .toHaveBeenCalledWith('200')
        expect(screen.getByRole('link', { name: 'Metro Onboarding Copilot' })
            .getAttribute('href'))
            .toBe('https://copilots.example.com/opportunity/17')
        expect(screen.getByRole('link', { name: 'Copilot Opportunity #12' })
            .getAttribute('href'))
            .toBe('https://copilots.example.com/opportunity/12')
    })

    it('shows an empty state when the project has no copilot opportunities', () => {
        mockUseFetchProjectCopilotOpportunities.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            opportunities: [],
        })

        render(<CopilotOpportunitiesModal onClose={jest.fn()} projectId='200' />)

        expect(screen.getByText('No copilot requests found for this project.'))
            .not
            .toBeNull()
    })

    it('shows an error message when the opportunities cannot be loaded', () => {
        mockUseFetchProjectCopilotOpportunities.mockReturnValue({
            error: new Error('boom'),
            isLoading: false,
            mutate: jest.fn(),
            opportunities: [],
        })

        render(<CopilotOpportunitiesModal onClose={jest.fn()} projectId='200' />)

        expect(screen.getByText('Unable to load copilot requests.'))
            .not
            .toBeNull()
    })

    it('closes from the close button and from the overlay', () => {
        mockUseFetchProjectCopilotOpportunities.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            opportunities: [],
        })

        const onClose = jest.fn()
        render(<CopilotOpportunitiesModal onClose={onClose} projectId='200' />)

        fireEvent.click(screen.getByRole('button', { name: 'Close' }))
        expect(onClose)
            .toHaveBeenCalledTimes(1)

        fireEvent.click(screen.getByRole('dialog'))
        expect(onClose)
            .toHaveBeenCalledTimes(1)
    })

    it('renders a loading state while the opportunities are fetched', () => {
        mockUseFetchProjectCopilotOpportunities.mockReturnValue({
            error: undefined,
            isLoading: true,
            mutate: jest.fn(),
            opportunities: [],
        })

        render(<CopilotOpportunitiesModal onClose={jest.fn()} projectId='200' />)

        expect(within(screen.getByRole('dialog'))
            .getByText('Loading'))
            .not
            .toBeNull()
    })
})
