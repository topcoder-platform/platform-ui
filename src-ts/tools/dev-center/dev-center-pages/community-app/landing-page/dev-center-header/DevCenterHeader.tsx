import { FC } from 'react'
import classNames from 'classnames'

import { ContentLayout } from '../../../../../../lib'

import DevCenterCarousel from './DevCenterCarousel/DevCenterCarousel'
import styles from './DevCenterHeader.module.scss'

const DevCenterHeader: FC<{}> = () => (
    <div className={styles.outerContainer}>
        <ContentLayout>
            <div className={styles.innerContainer}>
                <div className={styles.leftContent}>
                    <h1 className={styles.title}>
                        TopCoder
                        {' '}
                        <br />
                        Developer Center
                    </h1>
                    <span className={classNames(styles.subtitle, 'body-main')}>Let's build together with millions of Topcoder developers around the world.</span>
                </div>
                <div className={styles.rightContent}>
                    <DevCenterCarousel />
                </div>
            </div>
        </ContentLayout>
    </div>
)

export default DevCenterHeader
