import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'

import '../../lib/styles/index.scss'
import { UiRoute } from '../../lib/urls'

import styles from './LogoLink.module.scss'
// i'm not seeing anywhere where this image gets
// reused so am keeping it local instead of in
// the lib
import logoImage from './topcoder-mark.png'

const LogoLink: FC<{}> = () => {

    const logo: JSX.Element = <img src={logoImage} alt='Topcoder logo' className='pad-xl' />

    // the logo should be a link to the home page for all pages except the home page
    const routes: UiRoute = new UiRoute()
    const isLink: boolean = useLocation().pathname === routes.home
    const logoElement: JSX.Element = isLink
        ? logo
        : (
            <Link to={routes.home}>
                {logo}
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

export default LogoLink
