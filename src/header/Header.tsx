import { FC } from 'react'

import styles from './Header.module.scss'
import { Logo } from './logo'
import { ToolSelectors } from './tool-selectors'
import { UtilitySelectors } from './utility-selectors'

const Header: FC<{}> = () => {
    return (
        <header className={styles.header}>
            <ToolSelectors isWide={false} />
            <Logo />
            <ToolSelectors isWide={true} />
            <UtilitySelectors />
        </header>
    )
}

export default Header
