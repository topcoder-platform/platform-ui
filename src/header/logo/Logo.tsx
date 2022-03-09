import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { RouteConfig } from '../../config'
import { LogoIcon } from '../../lib'
import '../../lib/styles/index.scss'

import styles from './Logo.module.scss'

const Logo: FC<{}> = () => {

    // the logo should be a link to the home page for all pages except the home page
    const routes: RouteConfig = new RouteConfig()
    const isLink: boolean = routes.isHome(useLocation().pathname)

    return (
        <div className={styles[`logo-${isLink ? 'no-' : ''}link`]}>
            <Link to={routes.home}>
                <LogoIcon />
            </Link>
        </div>
    )
}

export default Logo
