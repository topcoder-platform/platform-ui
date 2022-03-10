import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { LogoIcon, routeRoot, routeIsActive } from '../../lib'
import '../../lib/styles/index.scss'

import styles from './Logo.module.scss'

const Logo: FC<{}> = () => {

    // the logo should be a link to the home page for all pages except the home page
    const isLink: boolean = routeIsActive(useLocation().pathname, routeRoot)

    return (
        <div className={styles[`logo-${isLink ? 'no-' : ''}link`]}>
            <Link to={routeRoot}>
                <LogoIcon />
            </Link>
        </div>
    )
}

export default Logo
