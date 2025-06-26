/**
 * Dialog edit user email.
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

import { FormEditUserEmail, UserInfo } from '../../models'
import { formEditUserEmailSchema, handleError } from '../../utils'
import { updateUserEmail } from '../../services'

import styles from './DialogEditUserEmail.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
    userInfo: UserInfo
}

export const DialogEditUserEmail: FC<Props> = (props: Props) => {
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
    }: UseFormReturn<FormEditUserEmail> = useForm({
        defaultValues: {
            email: props.userInfo.email,
        },
        mode: 'all',
        resolver: yupResolver(formEditUserEmailSchema),
    })
    const onSubmit = useCallback(() => {
        setShowConfirm(true)
    }, [])

    return (
        <>
            <BaseModal
                allowBodyScroll
                blockScroll
                title={`Email of ${props.userInfo.handle}`}
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
                            name='id'
                            label='ID'
                            placeholder='Enter'
                            tabIndex={0}
                            forceUpdateValue
                            onChange={_.noop}
                            disabled
                            value={props.userInfo.id}
                        />
                        <InputText
                            type='text'
                            name='oldEmail'
                            label='Email'
                            placeholder='Enter'
                            tabIndex={0}
                            forceUpdateValue
                            onChange={_.noop}
                            disabled
                            value={props.userInfo.email}
                        />
                        <InputText
                            type='text'
                            name='email'
                            label='New Value'
                            placeholder='Enter'
                            tabIndex={0}
                            forceUpdateValue
                            onChange={_.noop}
                            error={_.get(errors, 'email.message')}
                            inputControl={register('email')}
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
                            Close
                        </Button>
                        <Button
                            type='submit'
                            primary
                            size='lg'
                            disabled={isLoading || !isValid || !isDirty}
                        >
                            Save
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
                title='Save Confirmation'
                onClose={function onClose() {
                    setShowConfirm(false)
                }}
                onConfirm={function onConfirm() {
                    setShowConfirm(false)
                    setIsLoading(true)
                    const data = getValues()
                    updateUserEmail(props.userInfo.id, data.email ?? '')
                        .then(result => {
                            setIsLoading(false)
                            toast.success('Email updated successfully')
                            props.userInfo.email = result.email
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
                    <p>Are you sure you want to save changes?</p>
                </div>
            </ConfirmModal>
        </>
    )
}

export default DialogEditUserEmail
