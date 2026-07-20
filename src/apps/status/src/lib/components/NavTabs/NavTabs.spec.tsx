/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import { NavTabs } from './NavTabs'

jest.mock('~/config', () => ({
    AppSubdomain: { status: 'status' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
}), { virtual: true })

describe('Status navigation tabs', () => {
    it('derives the active tab from a nested route and exposes the mobile menu state', () => {
        render(
            <MemoryRouter initialEntries={['/status/api/orders/endpoints/failures']}>
                <NavTabs />
            </MemoryRouter>,
        )

        expect(screen.getByRole('link', { name: 'API' })
            .getAttribute('aria-current'))
            .toBe('page')

        const trigger = screen.getByRole('button', { name: /Status · API/ })
        expect(trigger.getAttribute('aria-expanded'))
            .toBe('false')

        fireEvent.click(trigger)

        expect(trigger.getAttribute('aria-expanded'))
            .toBe('true')
    })
})
