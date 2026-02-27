import { FC } from 'react'
import classNames from 'classnames'

import {
    BaseModal,
    Button,
    LoadingSpinner,
} from '~/libs/ui'

import styles from './ModalEventAdd.module.scss'

interface ModalEventAddProps {
    isAdmin: boolean
    onClose: () => void
    open: boolean
    uploading: boolean
    uploadResult: string
}

/**
 * Displays upload status feedback after submitting a timeline event.
 *
 * @param props Upload state and close callback.
 * @returns Submission confirmation modal.
 */
const ModalEventAdd: FC<ModalEventAddProps> = (props: ModalEventAddProps) => {
    const successMessage = props.isAdmin
        ? 'Thank you! Your event was added to the Timeline Wall.'
        : 'Thank you! Your event was submitted for review. You will receive an email once review is completed.'

    return (
        <BaseModal
            allowBodyScroll
            onClose={props.onClose}
            open={props.open}
            title={props.uploadResult ? 'Error' : 'Confirmation'}
        >
            {props.uploading ? (
                <div className={styles.loadingWrap}>
                    <LoadingSpinner />
                </div>
            ) : (
                <p className={classNames(styles.description, props.uploadResult && styles.error)}>
                    {props.uploadResult || successMessage}
                </p>
            )}

            <div className={styles.actions}>
                <Button
                    label='Cancel'
                    onClick={props.onClose}
                    secondary
                />
                <Button
                    disabled={props.uploading}
                    label='OK'
                    onClick={props.onClose}
                    primary
                />
            </div>
        </BaseModal>
    )
}

export default ModalEventAdd
