import { FC } from 'react'

import { HeaderProps } from '../lib/interfaces'
import '../lib/styles/index.scss'

import styles from './Header.module.scss'
import LogoLink from './logo/LogoLink'
import Menu from './menu/Menu'
import Tools from './tools/Tools'
import Utilities from './utilities/Utilities'

const Header: FC<HeaderProps> = (props: HeaderProps) => {
    return (
        <header className={styles.header}>
            <Menu />
            <LogoLink />
            <div className={styles.main}>
                <Tools />
                <Utilities initialized={props.initialized} profile={props.profile}></Utilities>
            </div>
        </header>
    )
}

export default Header
