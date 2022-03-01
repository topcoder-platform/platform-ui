import { FC } from 'react'

import ContentLayout from '../../lib/content-layout/ContentLayout'
import { ProfileProps } from '../../lib/interfaces'

import styles from './Home.module.scss'

const Home: FC<ProfileProps> = (props: ProfileProps) => (
    <ContentLayout profile={props.profile} classNames={styles.home}>
        <>
            Home
        </>
    </ContentLayout>
)

export default Home
