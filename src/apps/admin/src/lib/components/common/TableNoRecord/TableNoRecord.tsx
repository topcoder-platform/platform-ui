/**
 * Table No Record.
 */
import { FC } from 'react'
import classNames from 'classnames'

import { MSG_NO_RECORD_FOUND } from '~/apps/admin/src/config/index.config'

import styles from './TableNoRecord.module.scss'

interface Props {
    className?: string
    message?: string
}

export const TableNoRecord: FC<Props> = (props: Props) => (
    <p className={classNames(styles.container, props.className)}>
        {props.message ?? MSG_NO_RECORD_FOUND}
    </p>
)

export default TableNoRecord
