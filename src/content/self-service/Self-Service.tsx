import { FC } from 'react'

import ContentLayout from '../../lib/content-layout/Content-Layout'
import { ProfileProps } from '../../lib/interfaces'

import styles from './Self-Service.module.scss'

const SelfService: FC<ProfileProps> = (props: ProfileProps) => (
    <ContentLayout profile={props.profile} classNames={styles['self-service']}>
        <>
            <div>
                Self Service
            </div>
        </>
    </ContentLayout>
)

export default SelfService
