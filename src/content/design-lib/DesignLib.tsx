import { FC } from 'react'

import { ContentLayout } from '../../lib'

import { sections } from './config'
import styles from './DesignLib.module.scss'

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
