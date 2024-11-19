import { FC } from 'react'

import { DevCenterGetStarted } from './dev-center-get-started'
import { DevCenterHeader } from './dev-center-header'
import styles from './DevCenterLandingPage.module.scss'

const DevCenter: FC = () => (
    <div className={styles.container}>
        <DevCenterHeader />
        <DevCenterGetStarted />
    </div>
)

export default DevCenter
