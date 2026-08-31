/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { OpportunityHero } from './OpportunityHero'

describe('OpportunityHero', () => {
    it('renders the canonical Browse destination and live category summaries', () => {
        render(
            <MemoryRouter initialEntries={['/opportunities/competitions']}>
                <OpportunityHero
                    active='competitions'
                    summary={{
                        competitions: { amount: 38500, count: 12 },
                        copilots: { amount: 1200, count: 2 },
                        engagements: { count: 8, tag: 'Specific tag' },
                        reviews: { count: 3 },
                    }}
                />
            </MemoryRouter>,
        )

        expect(screen.queryByRole('tab'))
            .not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Competitions/ }))
            .toHaveAttribute('aria-current', 'page')
        expect(screen.getByText('$38.5k prizes'))
            .toBeInTheDocument()
        expect(screen.getByText('Specific tag'))
            .toBeInTheDocument()
    })
})
