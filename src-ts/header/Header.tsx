import {
    Dispatch,
    FC,
    MutableRefObject,
    SetStateAction,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react'
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let tcUniNav: any
UniNavSnippet(EnvironmentConfig.UNIVERSAL_NAV.URL)

const Header: FC = () => {

    const { activeToolName, activeToolRoute }: RouteContextData = useContext(routeContext)
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)
    const [ready, setReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const headerInit: MutableRefObject<boolean> = useRef(false)
    const navElementId: string = 'main-nav-el'

    useEffect(() => {

        if (headerInit.current) {
            return
        }

        headerInit.current = true

        tcUniNav(
            'init',
            navElementId,
            {
                onReady() {
                    setReady(true)
                    document.getElementById('root')?.classList.add('app-ready')
                },
                signIn() { window.location.href = authUrlLogin() },
                signOut() { window.location.href = authUrlLogout },
                signUp() { window.location.href = authUrlSignup() },
                type: 'tool',
            },
        )
    }, [])

    useEffect(() => {

        tcUniNav(
            'update',
            navElementId,
            {
                toolName: activeToolName,
                toolRoute: activeToolRoute,
            },
        )
    }, [
        activeToolName,
        activeToolRoute,
    ])

    useEffect(() => {

        if (!profileReady) {
            return
        }

        tcUniNav(
            'update',
            navElementId,
            {
                user: profile ? {
                    handle: profile.handle,
                    initials: `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`,
                    photoURL: profile.photoURL,
                    userId: profile.userId,
                } : undefined,
            },
        )
    }, [
        profileReady,
        profile,
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
