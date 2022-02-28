import { FC } from 'react'

import ContentLayout from '../../lib/content-layout/Content-Layout'
import { ProfileProps } from '../../lib/interfaces'

import styles from './Tool.module.scss'

export interface ToolProps {
    title?: string
}

const Tool: FC<ProfileProps> = (props: ProfileProps) => (
    <ContentLayout profile={props.profile} classNames={styles.tool}>
        <>
            Tool
        </>
    </ContentLayout>
)

export default Tool
