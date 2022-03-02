import { FC } from 'react'

import { HeaderProps } from '../lib'
import '../lib/styles/index.scss'

import styles from './Header.module.scss'
import Logo from './logo/Logo'
import ToolSelections from './tool-selections/ToolSelections'
import UtilitySelections from './utility-selections/UtilitySelections'

const Header: FC<HeaderProps> = (props: HeaderProps) => {
    return (
        <header className={styles.header}>
            <ToolSelections isWide={false} />
            <Logo />
            <div className={styles.main}>
                <ToolSelections isWide={true} />
                <UtilitySelections initialized={props.initialized} profile={props.profile} />
            </div>
        </header>
    )
}

export default Header
