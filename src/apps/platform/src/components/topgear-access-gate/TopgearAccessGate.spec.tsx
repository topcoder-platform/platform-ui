/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { login } from '../../../../../libs/core/lib/auth/authentication-functions/authentication-url.config'

import { TopgearAccessGate } from './TopgearAccessGate'
import { hasTopgearAccess } from './topgear-access.service'

let mockSubdomain = 'topgear'
let mockInitialized = true
let mockMemberId: number | undefined = 123
const mockLogin = jest.fn(login)
const mountedChild = jest.fn()

jest.mock('~/config', () => ({
    AppSubdomain: { topgear: 'topgear' },
    EnvironmentConfig: {
        AUTH: { ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder-dev.com' },
        get SUBDOMAIN(): string { return mockSubdomain },
    },
}), { virtual: true })
jest.mock('~/libs/core', () => ({
    authUrlLogin: (returnUrl: string) => mockLogin(returnUrl),
    useProfileContext: () => ({
        initialized: mockInitialized,
        isLoggedIn: !!mockMemberId,
        profile: mockMemberId ? { email: 'employee@wipro.com', userId: mockMemberId } : undefined,
    }),
}), { virtual: true })
jest.mock('~/libs/ui', () => ({
    LoadingSpinner: (props: { message: string }) => <div role='status'>{props.message}</div>,
}), { virtual: true })
jest.mock('./topgear-access.service', () => ({ hasTopgearAccess: jest.fn() }))
const checkAccess = hasTopgearAccess as jest.Mock

/** Represents a nested listing/detail route that must not mount before access is granted. */
const PrivateRoute = (): JSX.Element => {
    mountedChild()
    return <div>Private Topgear route</div>
}

/** Renders the gate in a router for the supplied direct path; children expose mounting as a spy. */
const renderGate = (path = '/opportunities/challenge'): ReturnType<typeof render> => render(
    <MemoryRouter initialEntries={[path]}>
        <TopgearAccessGate><PrivateRoute /></TopgearAccessGate>
    </MemoryRouter>,
)

describe('Topgear access gate', () => {
    const originalLocation = window.location
    const replace = jest.fn()

    beforeAll(() => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { href: 'https://topgear.topcoder-dev.com/opportunities/challenge?search=React#results', replace },
        })
    })
    afterAll(() => Object.defineProperty(window, 'location', { configurable: true, value: originalLocation }))
    beforeEach(() => {
        jest.clearAllMocks()
        mockLogin.mockImplementation(login)
        mockSubdomain = 'topgear'
        mockInitialized = true
        mockMemberId = 123
    })

    it('does not mount routes or check groups while the profile is loading', () => {
        mockInitialized = false
        renderGate()
        expect(screen.getByRole('status'))
            .toHaveTextContent('Checking Topgear access')
        expect(checkAccess).not.toHaveBeenCalled()
        expect(mountedChild).not.toHaveBeenCalled()
        expect(replace).not.toHaveBeenCalled()
    })

    it.each([
        ['topgear.topcoder.com', '/opportunities'],
        ['topgear.topcoder-dev.com', '/opportunities'],
        ['topgear.topcoder-dev.com', '/opportunities/challenge/123'],
        ['topgear.topcoder-dev.com', '/challenges'],
    ])('sends anonymous visitors on %s%s to Wipro login before loading routes', (hostname, path) => {
        mockMemberId = undefined
        window.location.href = `https://${hostname}${path}?search=React#results`
        const returnUrl = encodeURIComponent(window.location.href)
        renderGate(path)
        expect(mockLogin)
            .toHaveBeenCalledWith(window.location.href)
        expect(replace)
            .toHaveBeenCalledWith(
                `https://accounts-auth0.topcoder-dev.com?retUrl=${returnUrl}&utm_source=wipro`,
            )
        expect(checkAccess).not.toHaveBeenCalled()
        expect(mountedChild).not.toHaveBeenCalled()
    })

    const protectedPaths = ['/opportunities/challenge', '/opportunities/challenge/123', '/work']
    it.each(protectedPaths)('blocks non-members even with a Wipro email on %s', async path => {
        checkAccess.mockResolvedValue(false)
        renderGate(path)
        expect(await screen.findByRole('heading', { name: 'Topgear access restricted' }))
            .toBeInTheDocument()
        expect(mountedChild).not.toHaveBeenCalled()
    })

    it('waits for the membership response before mounting authorized content', async () => {
        let allow: (value: boolean) => void = () => undefined
        checkAccess.mockReturnValue(new Promise<boolean>(resolve => { allow = resolve }))
        renderGate()
        expect(mountedChild).not.toHaveBeenCalled()
        await act(async () => allow(true))
        expect(screen.getByText('Private Topgear route'))
            .toBeInTheDocument()
    })

    it('keeps routes hidden on membership errors and permits retry', async () => {
        checkAccess.mockRejectedValueOnce(new Error('Unavailable'))
            .mockResolvedValueOnce(true)
        renderGate()
        expect(await screen.findByText('Unable to verify Topgear access'))
            .toBeInTheDocument()
        expect(mountedChild).not.toHaveBeenCalled()
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
        expect(await screen.findByText('Private Topgear route'))
            .toBeInTheDocument()
    })

    it('does not reuse a successful membership check after the profile changes', async () => {
        checkAccess.mockResolvedValueOnce(true)
            .mockResolvedValueOnce(false)
        const view = renderGate()
        await screen.findByText('Private Topgear route')
        mockMemberId = 456
        view.rerender(<MemoryRouter><TopgearAccessGate><PrivateRoute /></TopgearAccessGate></MemoryRouter>)
        expect(screen.queryByText('Private Topgear route')).not.toBeInTheDocument()
        await screen.findByText('Topgear access restricted')
        expect(checkAccess)
            .toHaveBeenLastCalledWith('456', expect.any(AbortSignal))
    })

    it('cancels in-flight requests on unmount', () => {
        checkAccess.mockReturnValue(new Promise(() => { /* Keep the check pending until the component unmounts. */ }))
        const view = renderGate()
        const signal = checkAccess.mock.calls[0][1] as AbortSignal
        view.unmount()
        expect(signal.aborted)
            .toBe(true)
    })

    it.each(['www', 'topcoder', 'platform-ui', 'opportunities', 'wipro'])(
        'keeps the %s host public without checking Wipro membership',
        async subdomain => {
            mockSubdomain = subdomain
            mockMemberId = undefined
            renderGate('/opportunities')
            await waitFor(() => expect(screen.getByText('Private Topgear route'))
                .toBeInTheDocument())
            expect(checkAccess).not.toHaveBeenCalled()
            expect(replace).not.toHaveBeenCalled()
        },
    )
})
