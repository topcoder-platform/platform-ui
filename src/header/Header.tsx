import classNames from 'classnames'
import { FC } from 'react'

import { BaseProps } from '../lib/interfaces'
import '../lib/styles/index.scss'

import styles from './Header.module.scss'
import LogoLink from './logo/LogoLink'
import Tools from './tools/Tools'
import Utilities from './utilities/Utilities'

const Header: FC<BaseProps> = (props: BaseProps) => {
    return (
        <header className={styles.header}>
            <div className={classNames(styles.menu, 'font-tc-white')}>
                Menu
            </div>
            <LogoLink />
            <div className={styles.main}>
                <Tools />
                <Utilities initialized={props.initialized} profile={props.profile}></Utilities>
            </div>
        </header>
    )
}

export default Header
