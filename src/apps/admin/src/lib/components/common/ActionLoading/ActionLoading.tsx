/**
 * Action Loading.
 */
import { FC } from 'react'
import classNames from 'classnames'

import { LoadingSpinner } from '~/libs/ui'

import styles from './ActionLoading.module.scss'

interface Props {
    className?: string
}

export const ActionLoading: FC<Props> = (props: Props) => (
    <div className={classNames(styles.container, props.className)}>
        <LoadingSpinner className={styles.spinner} />
    </div>
)

export default ActionLoading
