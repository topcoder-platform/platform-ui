import { FC } from 'react'

import { ContentLayout, ProfileProps } from '../../../lib'
import { sections } from '../config'

import styles from './Buttons.module.scss'

const Buttons: FC<ProfileProps> = (props: ProfileProps) => {
    return (
        <ContentLayout profile={props.profile} classNames={styles['buttons']} sections={sections}>
            <>
                Buttons
            </>
        </ContentLayout>
    )
}

export default Buttons
