import {
    Dispatch,
    FC,
    MutableRefObject,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'
import type { AuthUser as NavAuthUser, TcUniNavFn } from 'universal-navigation'
import classNames from 'classnames'

import { PageSubheaderPortalId } from '~/config'
import {
    authUrlLogin,
    authUrlLogout,
    authUrlSignup,
    profileContext,
    ProfileContextData,
    routerContext,
    RouterContextData,
} from '~/libs/core'

import UniNavSnippet from './universal-nav-snippet'

declare let tcUniNav: TcUniNavFn
UniNavSnippet('https://uni-nav.topcoder-dev.com/v1/tc-universal-nav.js')

interface NavigationRequest {
    label: string
    path: string
}

const AppHeader: FC<{}> = () => {

    const { activeToolName, activeToolRoute }: RouterContextData = useContext(routerContext)
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)
    const [ready, setReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const headerInit: MutableRefObject<boolean> = useRef(false)
    const navElementId: string = PageSubheaderPortalId
    const navigate: NavigateFunction = useNavigate()

    // userinfo will be an empty object until profileReady=true
    // userinfo will be {user: undefined} if user is logged out
    // userinfo will have all user's details when user is logged in
    const userInfo: {} | undefined | NavAuthUser = useMemo(() => (
        !profileReady ? {} : ({
            user: profile ? {
                email: profile.email,
                firstName: profile.firstName,
                handle: profile.handle,
                lastName: profile.lastName,
                photoUrl: profile.photoURL,
                userId: profile.userId,
            } : undefined,
        })
    ), [profile, profileReady])

    const navigationHandler: (request: NavigationRequest) => void
        = useCallback((request: NavigationRequest) => {

            try {
                // strip the domain and navigate to the path
                navigate(new URL(request.path).pathname)
            } catch (error) {
                // if we couldn't navigate to the path, just go to the route of the currently active tool
                navigate(new URL(activeToolRoute || '/').pathname)
            }

        }, [
            activeToolRoute,
            navigate,
        ])

    // initialize uni-nav elements
    useEffect(() => {

        if (headerInit.current) {
            return
        }

        headerInit.current = true

        tcUniNav(
            'init',
            navElementId,
            {
                handleNavigation: navigationHandler,
                integrations: {
                    sprig: 'disable',
                },
                onReady() { setReady(true) },
                signIn() { window.location.href = authUrlLogin() },
                signOut() { window.location.href = authUrlLogout },
                signUp() { window.location.href = authUrlSignup() },
                toolName: activeToolName,
                toolRoot: activeToolRoute,
                type: 'tool',
                ...userInfo,
            },
        )
    }, [
        activeToolName,
        activeToolRoute,
        navElementId,
        navigationHandler,
        userInfo,
        profileReady,
    ])

    // update uni-nav's tool details
    useEffect(() => {

        tcUniNav(
            'update',
            navElementId,
            {
                toolName: activeToolName,
                toolRoot: activeToolRoute,
            },
        )
    }, [
        activeToolName,
        activeToolRoute,
        navElementId,
    ])

    // update uni-nav's user/auth details
    useEffect(() => {

        if (!profileReady) {
            return
        }

        tcUniNav(
            'update',
            navElementId,
            {
                ...userInfo,
            },
        )
    }, [
        profileReady,
        userInfo,
        navElementId,
    ])

    return (
        <div
            id={navElementId}
            className={classNames('full-width-relative', !ready && 'hidden')}
        />
    )
}

export default AppHeader
