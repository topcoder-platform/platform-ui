/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
    useLocation,
} from 'react-router-dom'

import { onboardingRoutes } from './onboarding.routes'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        SUBDOMAIN: 'onboarding',
    },
}), {
    virtual: true,
})

jest.mock('~/config/constants', () => ({
    AppSubdomain: {
        onboarding: 'onboarding',
    },
    ToolTitle: {
        onboarding: 'Onboarding',
    },
}), {
    virtual: true,
})

jest.mock('~/libs/core', () => ({
    lazyLoad: () => (): undefined => undefined,
    UserRole: {
        member: 'Topcoder User',
    },
}), {
    virtual: true,
})

const LocationViewer = (): JSX.Element => {
    const location = useLocation()

    return <div data-testid='location-pathname'>{location.pathname}</div>
}

describe('onboarding routes', () => {
    it('redirects a deeply nested invalid path to skills from the app root', async () => {
        const fallbackRoute = onboardingRoutes[0].children
            ?.find(route => route.route === '/*')

        render(
            <MemoryRouter initialEntries={['/invalid/nested/path']}>
                <Routes>
                    <Route element={<LocationViewer />} path='/skills' />
                    <Route element={fallbackRoute?.element} path='/*' />
                </Routes>
            </MemoryRouter>,
        )

        expect((await screen.findByTestId('location-pathname')).textContent)
            .toBe('/skills')
    })
})
