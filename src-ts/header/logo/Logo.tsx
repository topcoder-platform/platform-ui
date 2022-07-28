import { FC, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'

import {
    LogoIcon,
    routeContext,
    RouteContextData,
} from '../../lib'
import '../../lib/styles/index.scss'

import styles from './Logo.module.scss'

const Logo: FC<{}> = () => {

    const routeContextData: RouteContextData = useContext(routeContext)

    // the logo should be a link to the home page for all pages except the home page
    const isLink: boolean = !routeContextData.isRootRoute(useLocation().pathname)
    const rootRoute: string = routeContextData.rootLoggedInRoute || ''

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
