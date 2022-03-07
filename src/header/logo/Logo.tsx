import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { RouteConfig } from '../../config'
import '../../lib/styles/index.scss'

import styles from './Logo.module.scss'

const Logo: FC<{}> = () => {

    const logo: JSX.Element = (
        <svg width='56' height='20' viewBox='0 0 56 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path fillRule='evenodd' clipRule='evenodd' fill='white'
                d='M41.3598 6.43783C37.8628 2.64752 33.1651 0.327393 28 0.327393C22.8349 0.327393 18.1372 2.64752 14.6402 6.43783C16.7252 6.82006 18.8493 7.3265 20.9764 7.9341C22.7938 8.4532 24.5036 9.01807 25.937 9.55388C26.5096 9.76795 27.9438 10.3927 28 10.4211C28.0562 10.3927 29.4904 9.76795 30.063 9.55388C31.4964 9.01807 33.2062 8.4532 35.0236 7.9341C37.1507 7.3265 39.2748 6.82006 41.3598 6.43783ZM8.83198 13.3831C8.069 15.3838 7.54812 17.4959 7.28463 19.6728C2.98383 19.2056 0 12.5212 0 10.9236C0 8.27456 3.13148 6.95003 6.40964 6.95003C8.30361 6.95003 10.2342 7.11194 12.119 7.37528C10.7874 9.15687 9.67395 11.1752 8.83198 13.3831ZM27.3253 11.5859C26.6506 11.5859 20.97 13.2585 17.0361 15.3939C16.159 15.87 15.3006 16.3765 14.4666 16.8686L14.4666 16.8687C12.3377 18.1249 10.368 19.2872 8.65205 19.6101C8.91402 17.5897 9.40587 15.6565 10.0957 13.8474C10.9754 11.5408 12.177 9.43597 13.6346 7.60968C21.0212 8.85963 27.3253 11.4603 27.3253 11.5859ZM46.9714 12.8832C47.8417 15.0298 48.4297 17.3129 48.7154 19.6728C53.0162 19.2057 56 12.5212 56 10.9236C56 8.27456 52.8685 6.95003 49.5904 6.95003C47.6963 6.95003 45.7656 7.11195 43.8808 7.37531C45.1106 9.02084 46.1548 10.869 46.9714 12.8832ZM38.9639 15.3939C35.03 13.2585 29.3494 11.5859 28.6747 11.5859C28.6747 11.4603 34.9788 8.85963 42.3654 7.60968C43.7224 9.30997 44.8576 11.2516 45.7176 13.3729C46.5058 15.317 47.0629 17.4119 47.3479 19.6101C45.632 19.2872 43.6623 18.1249 41.5334 16.8687L41.5334 16.8687L41.5333 16.8686C40.6994 16.3765 39.841 15.87 38.9639 15.3939Z'
            />
        </svg>
    )

    // the logo should be a link to the home page for all pages except the home page
    const routes: RouteConfig = new RouteConfig()
    const isLink: boolean = routes.isHome(useLocation().pathname)
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

export default Logo
