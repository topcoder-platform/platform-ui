import { FC } from 'react'

import { ContentLayout } from '../../../lib'
import { sections } from '../sections.config'

import styles from './Buttons.module.scss'

const Buttons: FC<{}> = () => {
    return (
        <ContentLayout classNames={styles['buttons']} sections={sections}>
            <>
                Buttons
            </>
        </ContentLayout>
    )
}

export default Buttons
