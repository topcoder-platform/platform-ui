import { FC } from 'react'

import { ContentLayout } from '../../../lib'
import { sections } from '../config'

import styles from './Fonts.module.scss'

const Fonts: FC<{}> = () => {
    return (
        <ContentLayout classNames={styles['fonts']} sections={sections}>
            <>
                Fonts
            </>
        </ContentLayout>
    )
}

export default Fonts
