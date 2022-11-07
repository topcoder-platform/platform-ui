import { FC } from 'react'

import { ContentLayout } from '../../../../../../lib'

import { CardSection } from './CardSection'
import styles from './DevCenterArticlesSection.module.scss'

const DevCenterArticlesection: FC = () => (
    <div className={styles.container}>
        <ContentLayout>
            <h3 className={styles.title}>Success Stories And Articles</h3>
            <CardSection />
        </ContentLayout>
    </div>
)

export default DevCenterArticlesection
