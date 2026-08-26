/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import { campusRoutes, rootRoute } from './campus.routes'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        SUBDOMAIN: 'campus',
    },
}), {
    virtual: true,
})

jest.mock('~/config/constants', () => ({
    AppSubdomain: {
        campus: 'campus',
    },
    ToolTitle: {
        campus: 'Campus',
    },
}), {
    virtual: true,
})

jest.mock('~/libs/core', () => ({
    lazyLoad: () => (): undefined => undefined,
}), {
    virtual: true,
})

const LocationViewer = (): JSX.Element => {
    const location = useLocation()

    return <div data-testid='location-pathname'>{location.pathname}</div>
}

describe('campus routes', () => {
    it('redirects the campus root to /mecw when groupName is missing', async () => {
        const campusAppRoute = campusRoutes[0]
        const campusChildRoutes = campusAppRoute.children || []
        const fallbackRoute = campusChildRoutes.find(route => route.route === '')

        render(
            <MemoryRouter initialEntries={[rootRoute || '/']}>
                <Routes>
                    <Route element={<LocationViewer />} path={`${rootRoute}/mecw`} />
                    <Route element={fallbackRoute?.element} path={rootRoute || '/'} />
                </Routes>
            </MemoryRouter>,
        )

        expect((await screen.findByTestId('location-pathname')).textContent)
            .toBe('/mecw')
    })
})
