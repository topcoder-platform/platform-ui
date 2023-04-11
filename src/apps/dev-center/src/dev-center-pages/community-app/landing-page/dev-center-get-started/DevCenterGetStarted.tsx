import { FC } from 'react'

import { ContentLayout } from '~/libs/ui'

import { GetStartedCardsContainer } from './GetStartedCardsContainer'
import styles from './DevCenterGetStarted.module.scss'

const DevCenterGetStarted: FC = () => (
    <ContentLayout>
        <h3 className={styles.title}>Getting Started</h3>
        <GetStartedCardsContainer />
    </ContentLayout>
)

export default DevCenterGetStarted
