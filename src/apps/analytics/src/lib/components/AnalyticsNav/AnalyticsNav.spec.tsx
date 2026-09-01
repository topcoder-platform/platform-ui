/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { AnalyticsNav } from './AnalyticsNav'

jest.mock('~/config', () => ({
    AppSubdomain: { analytics: 'analytics' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
}), { virtual: true })

describe('Analytics navigation tabs', () => {
    it('renders only Campaigns and General with the current tab selected', () => {
        render(
            <MemoryRouter initialEntries={['/analytics/general']}>
                <AnalyticsNav />
            </MemoryRouter>,
        )

        expect(screen.getAllByRole('link')
            .map(link => link.textContent))
            .toEqual(['Campaigns', 'General'])
        expect(screen.getByRole('link', { name: 'General' }))
            .toHaveAttribute('aria-current', 'page')
        expect(screen.getByRole('button', { name: 'General' }))
            .toBeInTheDocument()
        expect(screen.queryByText('Analytics'))
            .not.toBeInTheDocument()
    })
})
