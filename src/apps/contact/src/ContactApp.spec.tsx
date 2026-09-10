/* Tests use the project testing-library dev dependency. */
/* eslint-disable import/no-extraneous-dependencies */
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { contactGet } from './contact.service'
import ContactApp from './ContactApp'

jest.mock('./contact.service', () => ({
    contactError: (error: Error) => error.message,
    contactGet: jest.fn(),
    contactPost: jest.fn(),
}))
jest.mock('./components/AutomationManager', () => ({
    AutomationManager: () => <h2>Automation workspace</h2>,
}))
jest.mock('./components/CampaignComposer', () => ({ CampaignComposer: () => <div>Composer</div> }))
jest.mock('./components/CampaignResults', () => ({ CampaignResults: () => <div>Results</div> }))
jest.mock('./components/SegmentManager', () => ({ SegmentManager: () => <h2>Segment workspace</h2> }))
jest.mock('./components/SubscriptionManager', () => ({
    SubscriptionManager: () => <h2>Subscription workspace</h2>,
}))

describe('Contact section tabs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (contactGet as jest.Mock).mockImplementation((path: string) => Promise.resolve(path === 'config'
            ? { sendingEnabled: true, subscriptionTypes: [], warnings: [] }
            : []))
    })

    it('switches labeled panels with pointer and wrapping keyboard navigation', async () => {
        render(<ContactApp />)
        await screen.findByRole('heading', { name: 'Email campaigns' })
        const campaigns = screen.getByRole('tab', { name: 'Campaigns' })
        const segments = screen.getByRole('tab', { name: 'Segments' })
        const subscriptions = screen.getByRole('tab', { name: 'Subscriptions' })
        const automations = screen.getByRole('tab', { name: 'Automations' })
        expect(screen.getAllByRole('tab'))
            .toHaveLength(4)
        expect(campaigns)
            .toHaveAttribute('aria-selected', 'true')
        expect(screen.getByRole('tabpanel', { name: 'Campaigns' }))
            .toBeInTheDocument()

        campaigns.focus()
        fireEvent.keyDown(campaigns, { key: 'ArrowRight' })
        expect(segments)
            .toHaveFocus()
        expect(segments)
            .toHaveAttribute('aria-selected', 'true')
        expect(campaigns)
            .toHaveAttribute('tabindex', '-1')
        expect(screen.getByRole('tabpanel', { name: 'Segments' }))
            .toHaveTextContent('Segment workspace')

        fireEvent.click(subscriptions)
        expect(screen.getByRole('tabpanel', { name: 'Subscriptions' }))
            .toHaveTextContent('Subscription workspace')
        fireEvent.keyDown(subscriptions, { key: 'End' })
        expect(automations)
            .toHaveFocus()
        expect(screen.getByRole('tabpanel', { name: 'Automations' }))
            .toHaveTextContent('Automation workspace')
        fireEvent.keyDown(automations, { key: 'ArrowRight' })
        expect(campaigns)
            .toHaveFocus()
        fireEvent.keyDown(campaigns, { key: 'ArrowLeft' })
        expect(automations)
            .toHaveFocus()
        fireEvent.keyDown(automations, { key: 'Home' })
        expect(campaigns)
            .toHaveFocus()
    })
})
