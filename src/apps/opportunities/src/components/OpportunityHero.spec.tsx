/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { OpportunityHero } from './OpportunityHero'

describe('OpportunityHero', () => {
    it('renders the canonical Browse destination and live category summaries', () => {
        const onModeChange = jest.fn()
        render(
            <MemoryRouter initialEntries={['/opportunities/competitions']}>
                <OpportunityHero
                    active='competitions'
                    mode='browse'
                    onModeChange={onModeChange}
                    summary={{
                        competitions: { amount: 38500, count: 12 },
                        copilots: { amount: 1200, count: 2 },
                        engagements: { count: 8, tag: 'Specific tag' },
                        reviews: { count: 3 },
                    }}
                    workCount={3}
                />
            </MemoryRouter>,
        )

        expect(screen.getByRole('tab', { name: 'Browse Opportunities' }))
            .toHaveAttribute('aria-selected', 'true')
        expect(screen.getByRole('tab', { name: 'My Work 3' }))
            .toHaveAttribute('aria-selected', 'false')
        expect(screen.getByRole('link', { name: /Competitions/ }))
            .toHaveAttribute('aria-current', 'page')
        expect(screen.getByText('$38.5k prizes'))
            .toBeInTheDocument()
        expect(screen.getByText('Specific tag'))
            .toBeInTheDocument()

        fireEvent.click(screen.getByRole('tab', { name: 'My Work 3' }))
        expect(onModeChange)
            .toHaveBeenCalledWith('work')
    })

    it('renders member-work counts and category shortcuts in the My Work destination', () => {
        const onWorkKindSelect = jest.fn()
        render(
            <MemoryRouter initialEntries={['/opportunities/competitions']}>
                <OpportunityHero
                    active='competitions'
                    mode='work'
                    onModeChange={jest.fn()}
                    onWorkKindSelect={onWorkKindSelect}
                    workCount={4}
                    workCounts={{
                        competitions: 1,
                        copilots: 1,
                        engagements: 1,
                        reviews: 1,
                    }}
                />
            </MemoryRouter>,
        )

        expect(screen.getByRole('tab', { name: 'My Work 4' }))
            .toHaveAttribute('aria-selected', 'true')
        expect(screen.getByRole('region', { name: 'My Work categories' }))
            .toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: '1 Copilot Opportunities' }))
        expect(onWorkKindSelect)
            .toHaveBeenCalledWith('copilots')
    })
})
