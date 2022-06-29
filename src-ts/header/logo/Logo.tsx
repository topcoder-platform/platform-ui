import { FC, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { LogoIcon, routeContext, RouteContextData } from '../../lib'
import '../../lib/styles/index.scss'

import styles from './Logo.module.scss'

const Logo: FC<{}> = () => {

    const {
        isRootRoute,
        rootLoggedInRoute,
    }: RouteContextData = useContext(routeContext)

    // the logo should be a link to the home page for all pages except the home page
    const isLink: boolean = !isRootRoute(useLocation().pathname)

    return (
        <div className={styles[`logo-${!isLink ? 'no-' : ''}link`]}>
            <Link
                tabIndex={-1}
                to={rootLoggedInRoute}
            >
                <LogoIcon />
            </Link>
        </div>
    )
}

export default Logo
