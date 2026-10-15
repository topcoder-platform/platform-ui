/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, global-require */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { EnvironmentConfig } from '~/config'
import { RouterProvider } from '../../../libs/core/lib/router/router-context/router.context-provider'
import PlatformRouter from '../../platform/src/platform-router/PlatformRouter'

import { forumsRoutes } from './forums.routes'

jest.mock('~/config', () => ({
    AppSubdomain: { forums: 'forums' },
    EnvironmentConfig: { SUBDOMAIN: 'platform' },
    ToolTitle: { forums: 'Forums' },
}), { virtual: true })
jest.mock('~/libs/core', () => ({
    ...jest.requireActual('../../../libs/core/lib/router/router-context/router.context'),
    ...jest.requireActual('../../../libs/core/lib/router/router.utils'),
}), { virtual: true })
jest.mock('../../../libs/core/lib/profile', () => ({
    profileContext: jest.requireActual('react')
        .createContext({ initialized: true }),
}))
jest.mock('../../../libs/core/lib/auth', () => ({ authUrlLogin: () => '/login' }))
jest.mock('~/libs/shared', () => ({ RestrictedPage: () => <div>Restricted</div> }), { virtual: true })
jest.mock('~/libs/ui', () => ({ LoadingSpinner: () => <div>Loading</div> }), { virtual: true })
jest.mock('./ForumsPage', () => ({
    __esModule: true,
    default: (props: { legacy?: boolean }) => {
        const params = jest.requireActual('react-router-dom')
            .useParams()

        return (
            <div>
                {params.categoryId || params.threadId || (props.legacy ? 'Legacy index' : 'Forum index')}
            </div>
        )
    },
}))

describe('ForumsApp with the platform router', () => {
    it.each([
        ['platform', '/forums', '', 'Forum index'],
        ['platform', '/forums', '/legacy', 'Legacy index'],
        ['platform', '/forums', '/category/category-123', 'category-123'],
        ['platform', '/forums', '/thread/thread-456', 'thread-456'],
        ['forums', '', '', 'Forum index'],
        ['forums', '', '/legacy', 'Legacy index'],
        ['forums', '', '/category/category-123', 'category-123'],
        ['forums', '', '/thread/thread-456', 'thread-456'],
    ])('renders the %s host at %s%s', async (host, root, path, expected) => {
        EnvironmentConfig.SUBDOMAIN = host
        // Route declaration tests verify each computed host root; exercise its real rendering contract here.
        const routes = forumsRoutes.map(route => ({ ...route, route: root }))
        render(
            <MemoryRouter initialEntries={[`${root}${path}` || '/']}>
                <RouterProvider allRoutes={routes} rootCustomer='' rootLoggedOut='' rootMember=''>
                    <PlatformRouter />
                </RouterProvider>
            </MemoryRouter>,
        )
        expect(await screen.findByText(expected))
            .toBeInTheDocument()
    })
})
