import { FC } from 'react'

import ContentLayout from '../../lib/content-layout/ContentLayout'
import { ProfileProps } from '../../lib/interfaces'

import styles from './SelfService.module.scss'

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
