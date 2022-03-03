import { FC } from 'react'

import { ContentLayout, ProfileProps } from '../../../lib'
import { sections } from '../sections.config'

import styles from './Icons.module.scss'

const Icons: FC<ProfileProps> = (props: ProfileProps) => {
    return (
        <ContentLayout profile={props.profile} classNames={styles['icons']} sections={sections}>
            <>
                Icons
            </>
        </ContentLayout>
    )
}

export default Icons
