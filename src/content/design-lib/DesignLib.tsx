import { FC } from 'react'

import { ContentLayout } from '../../lib'

import styles from './DesignLib.module.scss'
import { sections } from './sections.config'

const DesignLib: FC<{}> = () => {

    return (
        <>
            <ContentLayout classNames={styles['design-lib']} sections={sections}>
                <>
                    Design Library
                </>
            </ContentLayout>
        </>
    )
}

export default DesignLib
