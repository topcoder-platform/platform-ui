import { FC } from 'react'

import { ContentLayout } from '../../lib'

import styles from './SelfService.module.scss'

const SelfService: FC<{}> = () => (
    <ContentLayout classNames={styles['self-service']}>
        <>
            <div>
                Self Service
            </div>
        </>
    </ContentLayout>
)

export default SelfService
