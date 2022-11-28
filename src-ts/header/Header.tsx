import {
    Dispatch,
    FC,
    MutableRefObject,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'
import { type TcUniNavFn } from 'universal-navigation'
import classNames from 'classnames'

import { EnvironmentConfig, PageSubheaderPortalId } from '../config'
import {
    authUrlLogin,
    authUrlLogout,
    authUrlSignup,
    LoadingSpinner,
    profileContext,
    ProfileContextData,
    routeContext,
    RouteContextData,
} from '../lib'

import UniNavSnippet from './universal-nav-snippet'

declare let tcUniNav: TcUniNavFn
UniNavSnippet(EnvironmentConfig.UNIVERSAL_NAV.URL)

interface NavigationRequest {
    label: string
    path: string
}

const Header: FC = () => {

    const { activeToolName, activeToolRoute }: RouteContextData = useContext(routeContext)
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)
    const [ready, setReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const headerInit: MutableRefObject<boolean> = useRef(false)
    const navElementId: string = 'main-nav-el'
    const navigate: NavigateFunction = useNavigate()

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

    useEffect(() => {

        if (headerInit.current || !profileReady) {
            return
        }

        headerInit.current = true

        tcUniNav(
            'init',
            navElementId,
            {
                handleNavigation: navigationHandler,
                onReady() {
                    setReady(true)
                    document.getElementById('root')?.classList.add('app-ready')
                },
                signIn() { window.location.href = authUrlLogin() },
                signOut() { window.location.href = authUrlLogout },
                signUp() { window.location.href = authUrlSignup() },
                toolName: activeToolName,
                toolRoot: activeToolRoute,
                type: 'tool',
                user: profile ? {
                    handle: profile.handle,
                    initials: `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`,
                    photoUrl: profile.photoURL,
                    userId: profile.userId,
                } : undefined,
            },
        )
    }, [
        activeToolName,
        activeToolRoute,
        navigationHandler,
        profile,
        profileReady,
    ])

    useEffect(() => {

        if (!profileReady) {
            return
        }

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
        profileReady,
    ])

    return (
        <>
            <LoadingSpinner hide={ready} />
            <div id={navElementId} />
            <div
                id={PageSubheaderPortalId}
                className={classNames('full-width-relative')}
            />
        </>
    )
}

export default Header
