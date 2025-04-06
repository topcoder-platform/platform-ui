/**
 * Table Loading.
 */
import { FC } from 'react'
import classNames from 'classnames'

import { LoadingSpinner } from '~/libs/ui'

import styles from './TableLoading.module.scss'

interface Props {
    className?: string
}

export const TableLoading: FC<Props> = (props: Props) => (
    <div className={classNames(styles.container, props.className)}>
        <LoadingSpinner className={styles.spinner} />
    </div>
)

export default TableLoading
