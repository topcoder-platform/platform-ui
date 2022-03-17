import { FC } from 'react'

import { ContentLayout } from '../../lib'

import styles from './WorkIntake.module.scss'

export const toolTitle: string = 'Work'

const WorkIntake: FC<{}> = () => <ContentLayout classNames={styles['work-intake']} title={toolTitle} />

export default WorkIntake
