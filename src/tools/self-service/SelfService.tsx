import { FC } from 'react'

import { ContentLayout } from '../../lib'

import styles from './SelfService.module.scss'

export const toolTitle: string = 'Self Service'

const SelfService: FC<{}> = () => <ContentLayout classNames={styles['self-service']} title={toolTitle} />

export default SelfService
