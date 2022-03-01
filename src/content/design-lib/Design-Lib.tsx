import { FC } from 'react'

import { ContentLayout, ProfileProps } from '../../lib'

import styles from './Design-Lib.module.scss'
import { sections } from './sections.config'

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
