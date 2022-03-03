import { FC } from 'react'

import { ContentLayout } from '../../../lib'
import { sections } from '../config'

import styles from './Icons.module.scss'

const Icons: FC<{}> = () => {
    return (
        <ContentLayout classNames={styles['icons']} sections={sections}>
            <>
                Icons
            </>
        </ContentLayout>
    )
}

export default Icons
