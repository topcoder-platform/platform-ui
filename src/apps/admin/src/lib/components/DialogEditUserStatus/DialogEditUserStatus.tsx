/**
 * Dialog edit user status.
 */
import { FC, useCallback, useState } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import {
    BaseModal,
    Button,
    ConfirmModal,
    InputSelect,
    InputText,
    LoadingSpinner,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { FormEditUserStatus } from '../../models/FormEditUserStatus.model'
import { USER_STATUS_DETAIL_SELECT_OPTIONS } from '../../../config/index.config'
import { UserInfo } from '../../models'
import { formEditUserStatusSchema } from '../../utils'

import styles from './DialogEditUserStatus.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
    isLoading?: boolean
    userInfo: UserInfo
    doUpdateStatus: (
        userInfo: UserInfo,
        newStatus: string,
        comment: string,
        onSuccess?: () => void,
    ) => void
}

export const DialogEditUserStatus: FC<Props> = (props: Props) => {
    const handleClose = useCallback(() => {
        if (!props.isLoading) {
            props.setOpen(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.isLoading])
    const [showConfirm, setShowConfirm] = useState(false)
    const {
        control,
        register,
        handleSubmit,
        getValues,
        formState: { errors, isValid, isDirty },
    }: UseFormReturn<FormEditUserStatus> = useForm({
        defaultValues: {
            comment: '',
            status: props.userInfo.status,
        },
        mode: 'all',
        resolver: yupResolver(formEditUserStatusSchema(props.userInfo.status)),
    })
    const onSubmit = useCallback(() => {
        setShowConfirm(true)
    }, [])

    return (
        <>
            <BaseModal
                allowBodyScroll
                blockScroll
                title={`Status of ${props.userInfo.handle}`}
                onClose={handleClose}
                open={props.open}
                focusTrapped={false}
            >
                <form
                    className={classNames(styles.container, props.className)}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <div>
                        <Controller
                            name='status'
                            control={control}
                            render={function render(controlProps: {
                                field: ControllerRenderProps<
                                    FormEditUserStatus,
                                    'status'
                                >
                            }) {
                                return (
                                    <InputSelect
                                        name='status'
                                        label='New status'
                                        placeholder='Select'
                                        options={
                                            USER_STATUS_DETAIL_SELECT_OPTIONS
                                        }
                                        value={controlProps.field.value}
                                        onChange={controlProps.field.onChange}
                                        disabled={props.isLoading}
                                        error={_.get(errors, 'status.message')}
                                        dirty
                                    />
                                )
                            }}
                        />
                        <InputText
                            type='text'
                            name='comment'
                            label='Comment (optional)'
                            placeholder='Enter'
                            tabIndex={0}
                            forceUpdateValue
                            onChange={_.noop}
                            disabled={props.isLoading}
                            inputControl={register('comment')}
                        />
                    </div>
                    <div className={styles.actionButtons}>
                        <Button
                            secondary
                            size='lg'
                            onClick={handleClose}
                            disabled={props.isLoading}
                        >
                            Close
                        </Button>
                        <Button
                            type='submit'
                            primary
                            size='lg'
                            disabled={props.isLoading || !isValid || !isDirty}
                        >
                            Save
                        </Button>
                    </div>

                    {props.isLoading && (
                        <div className={styles.dialogLoadingSpinnerContainer}>
                            <LoadingSpinner className={styles.spinner} />
                        </div>
                    )}
                </form>
            </BaseModal>
            <ConfirmModal
                allowBodyScroll
                blockScroll
                title='Save Confirmation'
                onClose={function onClose() {
                    setShowConfirm(false)
                }}
                onConfirm={function onConfirm() {
                    setShowConfirm(false)

                    const data = getValues()
                    props.doUpdateStatus?.(
                        props.userInfo,
                        data.status,
                        data.comment ?? '',
                        handleClose,
                    )
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

export default DialogEditUserStatus
