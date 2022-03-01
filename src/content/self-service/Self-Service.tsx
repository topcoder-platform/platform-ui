import { FC } from 'react'

import { ContentLayout, ProfileProps } from '../../lib'

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
