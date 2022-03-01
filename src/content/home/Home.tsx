import { FC } from 'react'

import { ContentLayout, ProfileProps } from '../../lib'

import styles from './Home.module.scss'

const Home: FC<ProfileProps> = (props: ProfileProps) => (
    <ContentLayout profile={props.profile} classNames={styles.home} sections={[]}>
        <>
            Home
        </>
    </ContentLayout>
)

export default Home
