import { FC } from 'react'

import { ContentLayout, ProfileProps } from '../../lib'

import { sections } from './config'
import styles from './DesignLib.module.scss'

const DesignLib: FC<ProfileProps> = (props: ProfileProps) => {

    return (
        <>
            <ContentLayout profile={props.profile} classNames={styles['design-lib']} sections={sections}>
                <>
                    Design Library
                </>
            </ContentLayout>
        </>
    )
}

export default DesignLib
