import classNames from 'classnames'
import { FC } from 'react'

import '../lib/styles/index.scss'

import styles from './Header.module.scss'
import LogoLink from './logo/LogoLink'
import Utilities from './utilities/Utilities'

const Header: FC<{}> = () => {
    return (
        <header className={styles.header}>
            <div className={classNames(styles.menu, 'font-tc-white')}>
                Menu
            </div>
            <LogoLink />
            <div className={styles.main}>
                <div>Tools</div>
                <Utilities></Utilities>
            </div>
        </header>
    )
}

export default Header
