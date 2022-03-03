import { FC } from 'react'

import { HeaderProps } from './header-props.model'
import styles from './Header.module.scss'
import { Logo } from './logo'
import { ToolSelectors } from './tool-selectors'
import { UtilitySelectors } from './utility-selectors'

const Header: FC<HeaderProps> = (props: HeaderProps) => {
    return (
        <header className={styles.header}>
            <ToolSelectors isWide={false} />
            <Logo />
            <div className={styles.main}>
                <ToolSelectors isWide={true} />
                <UtilitySelectors initialized={props.initialized} profile={props.profile} />
            </div>
        </header>
    )
}

export default Header
