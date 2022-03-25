import { FC } from 'react'

import { ContentLayout } from '../../lib'

import styles from './Work.module.scss'

export const toolTitle: string = 'Work'

const MyWork: FC<{}> = () => <ContentLayout classNames={styles['mywork']} title={toolTitle} />

export default MyWork
