import { FC } from 'react'

import { Logo } from './logo'
import { ToolSelectors } from './tool-selectors'
import { UtilitySelectors } from './utility-selectors'
import styles from './Header.module.scss'

const Header: FC<{}> = () => (
    <div className={styles['header-wrap']}>
        <header className={styles.header}>
            <ToolSelectors isWide={false} />
            <Logo />
            <ToolSelectors isWide />
            <UtilitySelectors />
        </header>
        <div id='page-subheader-portal-el' className={styles.subheader} />
    </div>
)

export default Header
