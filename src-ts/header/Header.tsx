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

import { EnvironmentConfig, PagePortalId } from '../config'
import {
    authUrlLogin,
    authUrlLogout,
    authUrlSignup,
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

    const { activeToolName }: RouteContextData = useContext(routeContext)
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)
    const [ready, setReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const headerInit: MutableRefObject<boolean> = useRef(false)
    const navElementId: string = 'main-nav-el'

    useEffect(() => {

        if (headerInit.current || !profileReady || !tcUniNav) {
            return
        }

        headerInit.current = true

        tcUniNav(
            'tool',
            navElementId,
            {
                onReady() {
                    setReady(true)
                    document.getElementById('root')?.classList.add('app-ready')
                },
                signIn() { window.location.href = authUrlLogin() },
                signOut() { window.location.href = authUrlLogout },
                signUp() { window.location.href = authUrlSignup() },
                toolName: activeToolName,
                user: profileReady && profile ? {
                    handle: profile.handle,
                    initials: `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`,
                    photoURL: profile.photoURL,
                    userId: profile.userId,
                } : undefined,
            },
        )
    }, [
        activeToolName,
        profileReady,
        profile])

    return (
        <>
            <div id={navElementId} />
            <div
                id={PagePortalId}
                className={classNames('full-width-relative', !ready && 'hidden')}
            />
        </>
    )
}

export default Header
