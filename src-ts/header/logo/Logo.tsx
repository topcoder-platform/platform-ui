import { FC, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'

import {
    LogoIcon,
    profileContext,
    ProfileContextData,
    routeContext,
    RouteContextData,
} from '../../lib'
import '../../lib/styles/index.scss'

import styles from './Logo.module.scss'

const Logo: FC<{}> = () => {

    const { isLoggedIn }: ProfileContextData = useContext<ProfileContextData>(profileContext)
    const {
        isRootRoute,
        rootLoggedInRoute,
        rootLoggedOutRoute,
    }: RouteContextData = useContext(routeContext)

    // the logo should be a link to the home page for all pages except the home page
    const isLink: boolean = !isRootRoute(useLocation().pathname)
    const rootRoute: string = isLoggedIn ? rootLoggedInRoute : rootLoggedOutRoute

    return (
        <div className={styles[`logo-${!isLink ? 'no-' : ''}link`]}>
            <Link
                tabIndex={-1}
                to={rootRoute}
            >
                <LogoIcon />
            </Link>
        </div>
    )
}

export default Logo
