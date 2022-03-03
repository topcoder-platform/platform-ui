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
            <div className={styles.main}>
                <ToolSelectors isWide={true} />
                <UtilitySelectors />
            </div>
        </header>
    )
}

export default Header
