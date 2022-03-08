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
    const logoElement: JSX.Element = isLink
        ? <LogoIcon />
        : (
            <Link to={routes.home}>
                <LogoIcon />
            </Link>
        )

    // NOTE: i don't like having to use the square brackets,
    // but it's better than having camelCase class names. ~shudder~
    // styles don't seem to have intellisense, so not losing anything there.
    // can be convinced to switch to camelCase, tho
    const logoClass: string = isLink ? styles['logo-no-link'] : styles['logo-link']

    return (
        <div className={logoClass}>
            {logoElement}
        </div>
    )
}

export default Logo
