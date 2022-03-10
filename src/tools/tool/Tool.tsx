import { FC } from 'react'

import { ContentLayout } from '../../lib'

import styles from './Tool.module.scss'

export const toolTitle: string = 'Tool'

const Tool: FC<{}> = () => <ContentLayout classNames={styles.tool} title={toolTitle} />

export default Tool
