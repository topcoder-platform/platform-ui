/* eslint-disable global-require, import/no-extraneous-dependencies, ordered-imports/ordered-imports */
/* eslint-disable @typescript-eslint/no-var-requires, react/jsx-no-bind, sort-keys */
import { PropsWithChildren, ReactElement } from 'react'
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'

import ProcurementApp from './ProcurementApp'
import { PROCUREMENT_ALLOWED_ROLES, ProcurementRole } from './lib/constants/roles.constants'
import { procurementRoutes } from './procurement-app.routes'
import profileContext, {
    defaultProfileContextData,
} from '../../../libs/core/lib/profile/profile-context/profile.context'
import { ProfileContextData } from '../../../libs/core/lib/profile/profile-context/profile-context-data.model'
import {
    routerContext,
    routerContextDefaultData,
    RouterContextData,
} from '../../../libs/core/lib/router/router-context/router.context'
import RestrictedRoute from '../../../libs/core/lib/router/restricted.route'

jest.mock('~/config', () => ({
    AppSubdomain: {
        procurement: 'procurement',
    },
    EnvironmentConfig: {
        AUTH: {
            ACCOUNTS_APP_CONNECTOR: 'https://accounts.test',
        },
        SUBDOMAIN: 'platform',
    },
    ToolTitle: {
        procurement: 'procurement',
    },
}), {
    virtual: true,
})

jest.mock('~/libs/shared', () => ({
    RestrictedPage: () => <div>Restricted procurement access</div>,
}), {
    virtual: true,
})

jest.mock('../../../libs/core/lib/profile', () => {
    const profileContextModule = jest.requireActual(
        '../../../libs/core/lib/profile/profile-context/profile.context',
    ) as typeof import('../../../libs/core/lib/profile/profile-context/profile.context')

    return {
        defaultProfileContextData: profileContextModule.defaultProfileContextData,
        profileContext: profileContextModule.default,
    }
})

jest.mock('~/libs/core', () => {
    const React = require('react') as typeof import('react')

    const routerContextModule = jest.requireActual(
        '../../../libs/core/lib/router/router-context/router.context',
    ) as typeof import('../../../libs/core/lib/router/router-context/router.context')

    return {
        ...routerContextModule,
        lazyLoad: () => (): JSX.Element => React.createElement('div'),
    }
}, {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    ContentLayout: (props: PropsWithChildren<{ title?: string }>) => (
        <div>
            {!!props.title && <h1>{props.title}</h1>}
            {props.children}
        </div>
    ),
    LoadingSpinner: () => <div>Loading...</div>,
}), {
    virtual: true,
})

function renderRestrictedProcurementRoute(roles: string[]): void {
    const contextValue: ProfileContextData = {
        ...defaultProfileContextData,
        initialized: true,
        isLoggedIn: true,
        profile: {
            roles,
        } as ProfileContextData['profile'],
    }

    render(
        <profileContext.Provider value={contextValue}>
            <MemoryRouter>
                <RestrictedRoute
                    loginUrl='/login'
                    rolesRequired={PROCUREMENT_ALLOWED_ROLES}
                >
                    <div>Allowed procurement route</div>
                </RestrictedRoute>
            </MemoryRouter>
        </profileContext.Provider>,
    )
}

function renderProcurementApp(): void {
    const childRoutes: ReactElement[] = [
        <Route element={<div>Dashboard content</div>} key='dashboard' path='' />,
        <Route element={<div>Vendors content</div>} key='vendors' path='vendors' />,
    ]
    const routerValue: RouterContextData = {
        ...routerContextDefaultData,
        getChildRoutes: () => childRoutes,
        initialized: true,
    }

    render(
        <routerContext.Provider value={routerValue}>
            <MemoryRouter initialEntries={['/procurement']}>
                <Routes>
                    <Route element={<ProcurementApp />} path='/procurement/*' />
                </Routes>
            </MemoryRouter>
        </routerContext.Provider>,
    )
}

describe('procurement routes', () => {
    it('allows procurement-user through the gated route', () => {
        renderRestrictedProcurementRoute([ProcurementRole.user])

        expect(screen.getByText('Allowed procurement route'))
            .toBeTruthy()
        expect(procurementRoutes[0].rolesRequired)
            .toEqual(PROCUREMENT_ALLOWED_ROLES)
    })

    it('allows procurement-admin through the gated route', () => {
        renderRestrictedProcurementRoute([ProcurementRole.admin])

        expect(screen.getByText('Allowed procurement route'))
            .toBeTruthy()
    })

    it('shows the restricted page for logged-in users without procurement roles', () => {
        renderRestrictedProcurementRoute(['topcoder-staff'])

        expect(screen.getByText('Restricted procurement access'))
            .toBeTruthy()
        expect(screen.queryByText('Allowed procurement route'))
            .toBeNull()
    })

    it('navigates between internal procurement modules', () => {
        renderProcurementApp()

        expect(screen.getByText('Dashboard content'))
            .toBeTruthy()

        fireEvent.click(screen.getByRole('link', { name: 'Vendors' }))

        expect(screen.getByText('Vendors content'))
            .toBeTruthy()
    })
})
