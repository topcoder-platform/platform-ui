import { FC } from 'react'

import ContentLayout from '../../lib/content-layout/ContentLayout'
import { ProfileProps } from '../../lib/interfaces'

import styles from './DesignLib.module.scss'

const DesignLib: FC<ProfileProps> = (props: ProfileProps) => (
    <ContentLayout profile={props.profile} classNames={styles['design-lib']}>
        <>
            Design Library
        </>
    </ContentLayout>
)

export default DesignLib
