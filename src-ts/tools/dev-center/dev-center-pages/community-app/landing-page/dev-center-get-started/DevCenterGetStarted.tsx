import { FC } from 'react'

import { ContentLayout } from '../../../../../../lib'

import styles from './DevCenterGetStarted.module.scss'
import { GetStartedCardsContainer } from './GetStartedCardsContainer'

const DevCenterGetStarted: FC = () => {
    return (
        <ContentLayout>
            <h3 className={styles.title}>Getting Started</h3>
            <GetStartedCardsContainer/>
        </ContentLayout>
    )
}

export default DevCenterGetStarted
