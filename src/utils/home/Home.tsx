import { FC } from 'react'

import { ContentLayout } from '../../lib'

import styles from './Home.module.scss'

const Home: FC<{}> = () => <ContentLayout classNames={styles.home} title='Home' />

export default Home
