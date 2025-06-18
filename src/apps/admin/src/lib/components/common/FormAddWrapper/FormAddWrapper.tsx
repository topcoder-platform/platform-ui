/**
 * Form Add Wrapper.
 */
import { FC, FormEventHandler, PropsWithChildren, ReactNode } from 'react'
import classNames from 'classnames'

import { ActionLoading } from '../ActionLoading'

import styles from './FormAddWrapper.module.scss'

interface Props {
    className?: string
    onSubmit?: FormEventHandler<HTMLFormElement>
    actions?: ReactNode
    isAdding?: boolean
}

export const FormAddWrapper: FC<PropsWithChildren<Props>> = props => (
    <form
        className={classNames(styles.container, props.className)}
        onSubmit={props.onSubmit}
    >
        <div className={styles.blockFields}>{props.children}</div>

        <div className={styles.blockBtns}>{props.actions}</div>

        {props.isAdding && <ActionLoading />}
    </form>
)

export default FormAddWrapper
