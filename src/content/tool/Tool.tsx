import { FC } from 'react'

import { ContentLayout, ProfileProps } from '../../lib'

import styles from './Tool.module.scss'

const Tool: FC<ProfileProps> = (props: ProfileProps) => (
    <ContentLayout profile={props.profile} classNames={styles.tool}>
        <>
            Tool
        </>
    </ContentLayout>
)

export default Tool
