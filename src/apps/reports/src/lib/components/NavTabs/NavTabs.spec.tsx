/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { FC } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import NavTabs from './NavTabs'

jest.mock('~/config', () => ({
    AppSubdomain: { reports: 'reports' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
}), { virtual: true })

jest.mock('~/libs/shared/lib/hooks', () => ({
    useClickOutside: jest.fn(),
}), { virtual: true })

/**
 * Exposes the current test-router pathname after link navigation.
 *
 * @returns Current pathname in a test-only status element.
 * @throws Does not throw.
 */
const LocationProbe: FC = () => {
    const { pathname }: { pathname: string } = useLocation()
    return <output data-testid='location'>{pathname}</output>
}

describe('Reports navigation tabs', () => {
    it('keeps Dashboards active on a detail route and navigates with absolute links', () => {
        render(
            <MemoryRouter initialEntries={['/reports/dashboards/new-signups']}>
                <NavTabs />
                <LocationProbe />
            </MemoryRouter>,
        )

        const links = screen.getAllByRole('link')

        expect(links.slice(0, 2)
            .map(link => link.textContent))
            .toEqual(['Reports', 'Dashboards'])
        expect(screen.getByRole('link', { name: 'Dashboards' }))
            .toHaveAttribute('aria-current', 'page')
        expect(screen.getByRole('link', { name: 'Reports' }))
            .toHaveAttribute('href', '/reports/reports')

        const mobileTrigger = screen.getByRole('button', { name: 'Reports' })
        expect(mobileTrigger)
            .toHaveAttribute('aria-expanded', 'false')

        fireEvent.click(mobileTrigger)

        expect(mobileTrigger)
            .toHaveAttribute('aria-expanded', 'true')

        fireEvent.click(screen.getByRole('link', { name: 'Reports' }))

        expect(screen.getByTestId('location'))
            .toHaveTextContent('/reports/reports')
    })
})
