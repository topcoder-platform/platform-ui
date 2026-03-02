import { useContext } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { MemoryRouter, Routes } from 'react-router-dom'

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
        authUrlLogin: () => 'https://accounts.topcoder-dev.com?retUrl=http%3A%2F%2Flocalhost%2F',
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

jest.mock('../../../../../libs/core/lib/router/restricted.route', () => ({
    __esModule: true,
    default: (props: { loginUrl: string }) => (
        <div data-testid='restricted-route'>{props.loginUrl}</div>
    ),
}))

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
    groupIds: string[]
    path: string
    profile?: any
}

interface RouteRendererProps {
    route: any
}

const baseCommunityPath = `/${communityLoaderRouteId}/demo`
const communityLoaderRoute = getCommunityLoaderRoute()
const mockedUseCommunityMeta: jest.Mock = useCommunityMeta as unknown as jest.Mock
const mockedUseUserGroups: jest.Mock = useUserGroups as unknown as jest.Mock

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

function buildCommunityMeta(authorizedGroupIds: string[]): any {
    return {
        authorizedGroupIds,
        challengeFilter: {},
        communityId: 'demo',
        communityName: 'Demo Community',
        description: '',
        groupIds: [],
        hidden: false,
        logos: [],
        menuItems: [],
        metadata: {},
        subdomains: [],
        terms: [],
    }
}

function flushEffects(): Promise<void> {
    return act(async () => {
        await Promise.resolve()
    })
}

function getChildRoute(path: string): any {
    const route = communityLoaderRoute.children
        ?.find((candidate: any) => candidate.route === path)

    if (!route) {
        throw new Error(`Expected child route '${path}' to exist.`)
    }

    return route
}

function getCommunityLoaderRoute(): any {
    const route = communityLoaderRoutes
        .find((candidate: any) => candidate.id === communityLoaderRouteId)

    if (!route) {
        throw new Error('Expected a dynamic community loader route configuration.')
    }

    return route
}

function getElementByTestId(testId: string): HTMLElement | null {
    return container.querySelector(`[data-testid='${testId}']`)
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

const RouteRenderer = (props: RouteRendererProps): JSX.Element => {
    const routerContextData: any = useContext(routerContext)

    return (
        <Routes>
            {routerContextData.getRouteElement(props.route)}
        </Routes>
    )
}

function renderCommunityRoute(options: RenderCommunityRouteOptions): void {
    mockedUseCommunityMeta.mockReturnValue({
        communityMeta: buildCommunityMeta(options.authorizedGroupIds ?? []),
        isLoading: false,
    })
    mockedUseUserGroups.mockReturnValue({
        groupIds: options.groupIds,
        isLoading: false,
    })

    act(() => {
        root.render(
            <MemoryRouter initialEntries={[options.path]}>
                <profileContext.Provider value={getProfileContextData(options.profile)}>
                    <RouterProvider
                        allRoutes={[communityLoaderRoute]}
                        rootCustomer='/'
                        rootLoggedOut='/'
                        rootMember='/'
                    >
                        <RouteRenderer route={communityLoaderRoute} />
                    </RouterProvider>
                </profileContext.Provider>
            </MemoryRouter>,
        )
    })
}

describe('communityLoaderRoutes auth split', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        container = document.createElement('div')
        document.body.append(container)
        root = createRoot(container)
    })

    afterEach(() => {
        act(() => {
            root.unmount()
        })
        container.remove()
    })

    it('marks protected community content routes as auth required and keeps challenge routes public', () => {
        const defaultRoute = getChildRoute('')
        const homeRoute = getChildRoute('home')
        const learnRoute = getChildRoute('learn')
        const challengeDetailRoute = getChildRoute(challengeDetailRouteId)
        const challengeListingRoute = getChildRoute(challengeListingRouteId)

        expect(defaultRoute.authRequired)
            .toBe(true)
        expect(homeRoute.authRequired)
            .toBe(true)
        expect(learnRoute.authRequired)
            .toBe(true)
        expect(challengeDetailRoute.authRequired)
            .toBe(false)
        expect(challengeListingRoute.authRequired)
            .toBe(false)
    })

    it('renders challenge listing for anonymous users', async () => {
        renderCommunityRoute({
            groupIds: [],
            path: `${baseCommunityPath}/${challengeListingRouteId}`,
        })
        await flushEffects()

        expect(container.textContent?.includes('challenge-listing-route'))
            .toBe(true)
        expect(getElementByTestId('restricted-route'))
            .toBeNull()
    })

    it('renders challenge detail for anonymous users', async () => {
        renderCommunityRoute({
            groupIds: [],
            path: `${baseCommunityPath}/challenges/challenge-1`,
        })
        await flushEffects()

        expect(container.textContent?.includes('challenge-detail-route'))
            .toBe(true)
        expect(getElementByTestId('restricted-route'))
            .toBeNull()
    })

    it('routes anonymous users on /home through the login redirect path', async () => {
        renderCommunityRoute({
            groupIds: [],
            path: `${baseCommunityPath}/home`,
        })
        await flushEffects()

        expect(getElementByTestId('restricted-route')?.textContent)
            .toContain('retUrl=')
        expect(container.textContent?.includes('community-content-route'))
            .toBe(false)
    })

    it('shows NOT_AUTHORIZED when an authenticated user is outside authorizedGroupIds', async () => {
        const profile = {
            isCustomer: false,
            roles: [],
            userId: 123,
        }

        renderCommunityRoute({
            authorizedGroupIds: ['authorized-group'],
            groupIds: ['different-group'],
            path: `${baseCommunityPath}/${challengeListingRouteId}`,
            profile,
        })
        await flushEffects()

        expect(getElementByTestId('access-denied')?.textContent)
            .toBe('NOT_AUTHORIZED')
        expect(container.textContent?.includes('challenge-listing-route'))
            .toBe(false)
    })
})
