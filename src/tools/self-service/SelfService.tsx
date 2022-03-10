import { FC } from 'react'

import { ContentLayout } from '../../lib'

import styles from './SelfService.module.scss'

const SelfService: FC<{}> = () => <ContentLayout classNames={styles['self-service']} title='Self Service' />

export default SelfService
