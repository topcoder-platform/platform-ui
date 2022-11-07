import { ReactElement } from 'react'

import { ContentLayout } from '..'

import styles from './RestrictedPage.module.scss'

export const RestrictedPage: ReactElement =
    <ContentLayout
        contentClass={styles.contentLayout}
        outerClass={styles['contentLayout-outer']}
        innerClass={styles['contentLayout-inner']}
        title='Thanks for visiting'
    >
        <div className={styles.container}>
            <p>Unfortunately, you are not permitted to access the site. If you feel you should be able to, please <a href='/support'>contact us</a>.</p>
        </div>
    </ContentLayout>
