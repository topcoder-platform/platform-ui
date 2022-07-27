import { FC } from 'react'

import { ContentLayout } from '../../../../../lib'
import { LayoutDocFooter } from '../../../dev-center-lib/MarkdownDoc'

import { DevCenterArticlesection } from './dev-center-articles-section'
import { DevCenterGetStarted } from './dev-center-get-started'
import { DevCenterHeader } from './dev-center-header'
import styles from './DevCenterLandingPage.module.scss'

export const toolTitle: string = 'Developer Center'

const DevCenter: FC = () => {

    return (
        <div className={styles.container}>
            <DevCenterHeader/>
            <DevCenterGetStarted/>
            <DevCenterArticlesection/>
            <ContentLayout>
                <LayoutDocFooter/>
            </ContentLayout>
        </div>
    )
}

export default DevCenter
