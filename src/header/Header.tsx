import { FC } from 'react'

import styles from './Header.module.scss'
import LogoLink from './LogoLink/LogoLink'

const Header: FC<{}> = () => {
    return (
        <header className={styles.header} data-testid='header'>
            <LogoLink />
        </header>
    )
}

export default Header
