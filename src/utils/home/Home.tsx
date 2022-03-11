import { FC } from 'react'

import { ContentLayout } from '../../lib'

import styles from './Home.module.scss'

export const utilTitle: string = 'Home'

const Home: FC<{}> = () => <ContentLayout classNames={styles.home} title={utilTitle} />

export default Home
