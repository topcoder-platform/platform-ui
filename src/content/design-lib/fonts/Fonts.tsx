import { FC } from 'react'

import { ContentLayout, ProfileProps } from '../../../lib'
import { sections } from '../sections.config'

import styles from './Fonts.module.scss'

const Fonts: FC<ProfileProps> = (props: ProfileProps) => {
    return (
        <ContentLayout profile={props.profile} classNames={styles['fonts']} sections={sections}>
            <>
                Fonts
            </>
        </ContentLayout>
    )
}

export default Fonts
