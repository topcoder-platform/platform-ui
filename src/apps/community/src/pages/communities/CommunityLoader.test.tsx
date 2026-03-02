/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { useContext } from 'react'
import { MemoryRouter, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'

import { routerContext } from '../../../../../libs/core/lib/router/router-context/router.context'
import { RouterProvider } from '../../../../../libs/core/lib/router/router-context/router.context-provider'
import {
    challengeDetailRouteId,
    challengeListingRouteId,
    communityLoaderRouteId,
} from '../../config/routes.config'
import { useCommunityMeta, useUserGroups } from '../../lib/hooks'
import profileContext from '../../../../../libs/core/lib/profile/profile-context/profile.context'

import { communityLoaderRoutes } from './community.routes'

const mockAuthUrlLogin = jest.fn(
    (returnUrl?: string) => `https://accounts.topcoder-dev.com?retUrl=${encodeURIComponent(returnUrl ?? '')}`,
)

jest.mock('~/config', () => ({
    AppSubdomain: {
        community: 'community',
    },
    EnvironmentConfig: {
        AUTH: {
            ACCOUNTS_APP_CONNECTOR: 'https://accounts.topcoder-dev.com',
        },
        SUBDOMAIN: 'community',
    },
    ToolTitle: {
        tcAcademy: 'tcAcademy',
    },
}), { virtual: true })

jest.mock('~/libs/core', () => {
    const profileContextModule = jest.requireActual(
        '../../../../../libs/core/lib/profile/profile-context/profile.context',
    )
    const routerContextModule = jest.requireActual(
        '../../../../../libs/core/lib/router/router-context/router.context',
    )

    return {
        authUrlLogin: (returnUrl?: string) => mockAuthUrlLogin(returnUrl),
        profileContext: profileContextModule.default,
        routerContext: routerContextModule.routerContext,
    }
}, { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string }) => (
        <button type='button'>{props.label}</button>
    ),
    LoadingSpinner: () => <div>loading</div>,
    TcLogoSvg: () => <svg />,
}), { virtual: true })

jest.mock('../../../../../libs/core/lib/auth', () => ({
    authUrlLogin: () => 'https://accounts.topcoder-dev.com?retUrl=http%3A%2F%2Flocalhost%2F',
}))

jest.mock('../../../../../libs/core/lib/profile', () => {
    const profileContextModule = jest.requireActual(
        '../../../../../libs/core/lib/profile/profile-context/profile.context',
    )

    return {
        profileContext: profileContextModule.default,
    }
})

jest.mock('../../../../../libs/core/lib/router/restricted.route', () => {
    const React = jest.requireActual('react')
    const profileContextModule = jest.requireActual(
        '../../../../../libs/core/lib/profile/profile-context/profile.context',
    )
    const MockRestrictedRoute = (props: { children: JSX.Element, loginUrl: string }): JSX.Element => {
        const profileContextData = React.useContext(profileContextModule.default)
        if (profileContextData.profile) {
            return props.children
        }

        return <div data-testid='restricted-route'>{props.loginUrl}</div>
    }

    return {
        __esModule: true,
        default: MockRestrictedRoute,
    }
})

jest.mock('../../lib/components', () => ({
    AccessDenied: (props: { cause: string }) => (
        <div data-testid='access-denied'>{props.cause}</div>
    ),
    AccessDeniedCause: {
        NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
        NOT_AUTHORIZED: 'NOT_AUTHORIZED',
    },
    CommunityLayout: (props: { children?: JSX.Element | JSX.Element[] }) => (
        <div data-testid='community-layout'>{props.children}</div>
    ),
}))

jest.mock('../../lib/hooks', () => ({
    useCommunityMeta: jest.fn(),
    useUserGroups: jest.fn(),
}))

jest.mock('../challenge-detail', () => ({
    ChallengeDetail: () => <div>challenge-detail-route</div>,
}))

jest.mock('../challenge-listing', () => ({
    ChallengeListing: () => <div>challenge-listing-route</div>,
}))

jest.mock('../submission-management/SubmissionManagementPage', () => ({
    __esModule: true,
    default: () => <div>submission-management-route</div>,
}))

jest.mock('../submission/SubmissionPage', () => ({
    __esModule: true,
    default: () => <div>submission-route</div>,
}))

jest.mock('./CommunityContentPage', () => ({
    CommunityContentPage: () => <div>community-content-route</div>,
}))

jest.mock('./CommunityLeaderboardPage', () => ({
    CommunityLeaderboardPage: () => <div>community-leaderboard-route</div>,
}))

interface RenderCommunityRouteOptions {
    authorizedGroupIds?: string[]
    communityMeta?: any
    groupIds?: string[]
    path: string
    profile?: any
    route: any
}

interface RouteRendererProps {
    route: any
}

const baseCommunityPath = `/${communityLoaderRouteId}/demo`
const dynamicCommunityLoaderRoute = getRouteById(communityLoaderRouteId)
const mockedUseCommunityMeta: jest.Mock = useCommunityMeta as unknown as jest.Mock
const mockedUseUserGroups: jest.Mock = useUserGroups as unknown as jest.Mock
const wiproCommunityLoaderRoute = getRouteByPath(`${communityLoaderRouteId}/wipro`)

function buildCommunityMeta(authorizedGroupIds: string[], communityGroupIds: string[] = []): any {
    return {
        authorizedGroupIds,
        challengeFilter: {},
        communityId: 'demo',
        communityName: 'Demo Community',
        description: '',
        groupIds: communityGroupIds,
        hidden: false,
        logos: [],
        menuItems: [],
        metadata: {},
        subdomains: [],
        terms: [],
    }
}

function getChildRoute(route: any, path: string): any {
    const childRoute = route.children
        ?.find((candidate: any) => candidate.route === path)

    if (!childRoute) {
        throw new Error(`Expected child route '${path}' to exist.`)
    }

    return childRoute
}

function getProfileContextData(profile?: any): any {
    return {
        changePassword: async () => Promise.resolve(),
        initialized: true,
        isLoggedIn: !!profile,
        profile,
        updateProfile: async () => Promise.resolve(),
        updateProfileContext: () => undefined,
    }
}

function getRouteById(routeId: string): any {
    const route = communityLoaderRoutes
        .find((candidate: any) => candidate.id === routeId)

    if (!route) {
        throw new Error(`Expected route '${routeId}' to exist.`)
    }

    return route
}

function getRouteByPath(path: string): any {
    const route = communityLoaderRoutes
        .find((candidate: any) => candidate.route === path)

    if (!route) {
        throw new Error(`Expected route path '${path}' to exist.`)
    }

    return route
}

const RouteRenderer = (props: RouteRendererProps): JSX.Element => {
    const routerContextData: any = useContext(routerContext)

    return (
        <Routes>
            {routerContextData.getRouteElement(props.route)}
        </Routes>
    )
}

function renderCommunityRoute(options: RenderCommunityRouteOptions): void {
    const routeMeta = 'communityMeta' in options
        ? options.communityMeta
        : buildCommunityMeta(
            options.authorizedGroupIds ?? [],
            options.groupIds ?? [],
        )

    mockedUseCommunityMeta.mockReturnValue({
        communityMeta: routeMeta,
        isLoading: false,
    })
    mockedUseUserGroups.mockReturnValue({
        groupIds: options.groupIds ?? [],
        isLoading: false,
    })

    render(
        <MemoryRouter initialEntries={[options.path]}>
            <profileContext.Provider value={getProfileContextData(options.profile)}>
                <RouterProvider
                    allRoutes={[options.route]}
                    rootCustomer='/'
                    rootLoggedOut='/'
                    rootMember='/'
                >
                    <RouteRenderer route={options.route} />
                </RouterProvider>
            </profileContext.Provider>
        </MemoryRouter>,
    )
}

describe('CommunityLoader auth model', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('keeps challenge routes public while protecting /home', () => {
        const challengeDetailRoute = getChildRoute(dynamicCommunityLoaderRoute, challengeDetailRouteId)
        const challengeListingRoute = getChildRoute(dynamicCommunityLoaderRoute, challengeListingRouteId)
        const homeRoute = getChildRoute(dynamicCommunityLoaderRoute, 'home')

        expect(homeRoute.authRequired)
            .toBe(true)
        expect(challengeDetailRoute.authRequired)
            .toBe(false)
        expect(challengeListingRoute.authRequired)
            .toBe(false)
    })

    it('renders anonymous users on the public challenge listing route', async () => {
        renderCommunityRoute({
            path: `${baseCommunityPath}/${challengeListingRouteId}`,
            route: dynamicCommunityLoaderRoute,
        })

        expect(await screen.findByText('challenge-listing-route'))
            .toBeTruthy()
        expect(screen.queryByTestId('access-denied'))
            .toBeNull()
        expect(screen.queryByTestId('community-layout'))
            .toBeTruthy()
        expect(screen.queryByTestId('restricted-route'))
            .toBeNull()
    })

    it('renders anonymous users on the public challenge detail route', async () => {
        renderCommunityRoute({
            path: `${baseCommunityPath}/challenges/challenge-1`,
            route: dynamicCommunityLoaderRoute,
        })

        expect(await screen.findByText('challenge-detail-route'))
            .toBeTruthy()
        expect(screen.queryByTestId('access-denied'))
            .toBeNull()
        expect(screen.queryByTestId('restricted-route'))
            .toBeNull()
    })

    it('routes anonymous /home requests through login redirect handling', async () => {
        renderCommunityRoute({
            path: `${baseCommunityPath}/home`,
            route: dynamicCommunityLoaderRoute,
        })

        const restrictedRoute = await screen.findByTestId('restricted-route')
        expect(restrictedRoute.textContent)
            .toContain('retUrl=')
        expect(screen.queryByText('community-content-route'))
            .toBeNull()
    })

    it.each([
        `${baseCommunityPath}/home`,
        `${baseCommunityPath}/${challengeListingRouteId}`,
    ])(
        'shows NOT_AUTHORIZED for authenticated users outside authorized groups on %s',
        async (path: string) => {
            renderCommunityRoute({
                authorizedGroupIds: ['authorized-group'],
                groupIds: ['different-group'],
                path,
                profile: {
                    isCustomer: false,
                    roles: [],
                    userId: 123,
                },
                route: dynamicCommunityLoaderRoute,
            })

            expect((await screen.findByTestId('access-denied')).textContent)
                .toBe('NOT_AUTHORIZED')
            expect(screen.queryByTestId('restricted-route'))
                .toBeNull()
        },
    )

    it('allows authenticated members to render protected child routes', async () => {
        renderCommunityRoute({
            authorizedGroupIds: ['authorized-group'],
            groupIds: ['authorized-group'],
            path: `${baseCommunityPath}/home`,
            profile: {
                isCustomer: false,
                roles: [],
                userId: 321,
            },
            route: dynamicCommunityLoaderRoute,
        })

        expect(await screen.findByText('community-content-route'))
            .toBeTruthy()
        expect(screen.queryByTestId('access-denied'))
            .toBeNull()
        expect(screen.queryByTestId('restricted-route'))
            .toBeNull()
    })

    it('shows NOT_AUTHORIZED when community metadata is unavailable', async () => {
        renderCommunityRoute({
            communityMeta: undefined,
            path: `${baseCommunityPath}/${challengeListingRouteId}`,
            profile: {
                isCustomer: false,
                roles: [],
                userId: 99,
            },
            route: dynamicCommunityLoaderRoute,
        })

        expect((await screen.findByTestId('access-denied')).textContent)
            .toBe('NOT_AUTHORIZED')
        expect(screen.queryByText('challenge-listing-route'))
            .toBeNull()
    })

    it('redirects anonymous wipro traffic through the login URL', async () => {
        renderCommunityRoute({
            path: `/${communityLoaderRouteId}/wipro/${challengeListingRouteId}`,
            route: wiproCommunityLoaderRoute,
        })

        await waitFor(() => {
            expect(mockAuthUrlLogin)
                .toHaveBeenCalledWith(window.location.href)
        })
        expect(screen.queryByText('loading'))
            .toBeTruthy()
    })
})
