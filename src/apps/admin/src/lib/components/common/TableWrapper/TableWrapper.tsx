/**
 * Table Wrapper.
 */
import { FC, PropsWithChildren } from 'react'
import classNames from 'classnames'

import styles from './TableWrapper.module.scss'

interface Props {
    className?: string
}

export const TableWrapper: FC<PropsWithChildren<Props>> = props => (
    <div className={classNames(styles.container, props.className)}>
        {props.children}
    </div>
)

export default TableWrapper
