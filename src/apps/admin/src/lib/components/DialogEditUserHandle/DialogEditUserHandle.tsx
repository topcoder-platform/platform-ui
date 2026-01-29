/**
 * Dialog edit user handle.
 */
import { FC, useCallback, useState } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { toast } from 'react-toastify'
import _ from 'lodash'
import classNames from 'classnames'

import {
    BaseModal,
    Button,
    ConfirmModal,
    InputText,
    LoadingSpinner,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { FormEditUserHandle, UserInfo } from '../../models'
import { formEditUserHandleSchema, handleError } from '../../utils'
import { changeUserHandle } from '../../services'

import styles from './DialogEditUserHandle.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
    userInfo: UserInfo
}

export const DialogEditUserHandle: FC<Props> = (props: Props) => {
    const [isLoading, setIsLoading] = useState(false)
    const handleClose = useCallback(() => {
        if (!isLoading) {
            props.setOpen(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading])
    const [showConfirm, setShowConfirm] = useState(false)
    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors, isValid, isDirty },
    }: UseFormReturn<FormEditUserHandle> = useForm({
        defaultValues: {
            newHandle: '',
        },
        mode: 'all',
        resolver: yupResolver(formEditUserHandleSchema),
    })
    const onSubmit = useCallback(() => {
        setShowConfirm(true)
    }, [])
    const currentHandle = props.userInfo.handle
    const newHandle = getValues().newHandle ?? ''
    const confirmMessage = `Are you sure you want to change the handle from "${currentHandle}" `
        + `to "${newHandle}"?`

    return (
        <>
            <BaseModal
                allowBodyScroll
                blockScroll
                title={`Change handle for ${props.userInfo.handle}`}
                onClose={handleClose}
                open={props.open}
            >
                <form
                    className={classNames(styles.container, props.className)}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <div className={styles.blockForm}>
                        <InputText
                            type='text'
                            name='currentHandle'
                            label='Current Handle'
                            placeholder='Enter'
                            tabIndex={0}
                            forceUpdateValue
                            onChange={_.noop}
                            disabled
                            value={props.userInfo.handle}
                        />
                        <InputText
                            type='text'
                            name='newHandle'
                            label='New Handle'
                            placeholder='Enter'
                            tabIndex={0}
                            forceUpdateValue
                            onChange={_.noop}
                            error={_.get(errors, 'newHandle.message')}
                            inputControl={register('newHandle')}
                            dirty
                            disabled={isLoading}
                        />
                    </div>
                    <div className={styles.actionButtons}>
                        <Button
                            secondary
                            size='lg'
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type='submit'
                            primary
                            size='lg'
                            disabled={isLoading || !isValid || !isDirty}
                        >
                            Continue
                        </Button>
                    </div>

                    {isLoading && (
                        <div className={styles.dialogLoadingSpinnerContainer}>
                            <LoadingSpinner className={styles.spinner} />
                        </div>
                    )}
                </form>
            </BaseModal>
            <ConfirmModal
                allowBodyScroll
                blockScroll
                focusTrapped={false}
                title='Confirm Handle Change'
                action='Confirm'
                onClose={function onClose() {
                    setShowConfirm(false)
                }}
                onConfirm={function onConfirm() {
                    setShowConfirm(false)
                    setIsLoading(true)
                    const data = getValues()
                    const nextHandle = (data.newHandle ?? '').trim()

                    changeUserHandle(props.userInfo.handle, nextHandle)
                        .then(result => {
                            setIsLoading(false)
                            toast.success('Handle updated successfully')
                            props.userInfo.handle = result?.handle ?? nextHandle
                            handleClose()
                        })
                        .catch(e => {
                            handleError(e)
                            setIsLoading(false)
                        })
                }}
                open={showConfirm}
            >
                <div>
                    <p>{confirmMessage}</p>
                </div>
            </ConfirmModal>
        </>
    )
}

export default DialogEditUserHandle
