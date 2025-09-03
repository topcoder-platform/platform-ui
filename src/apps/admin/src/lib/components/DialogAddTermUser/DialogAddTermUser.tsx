/**
 * Dialog Add Term User.
 */
import { FC, useCallback } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import { yupResolver } from '@hookform/resolvers/yup'
import { BaseModal, Button, LoadingSpinner } from '~/libs/ui'

import { useEventCallback } from '../../hooks'
import { UserTerm } from '../../models'
import { FormAddTermUser } from '../../models/FormAddTermUser.model'
import { formAddTermUserSchema } from '../../utils'
import { FieldHandleSelect } from '../FieldHandleSelect'

import styles from './DialogAddTermUser.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
    termInfo: UserTerm
    isAdding: boolean
    doAddTermUser: (
        userId: number,
        userHandle: string,
        sucess: () => void,
        fail: () => void,
    ) => void
}

export const DialogAddTermUser: FC<Props> = (props: Props) => {
    const handleClose = useEventCallback(() => props.setOpen(false))
    const {
        handleSubmit,
        control,
        reset,
        formState: { errors, isValid, isDirty },
    }: UseFormReturn<FormAddTermUser> = useForm({
        defaultValues: {
            handle: undefined,
        },
        mode: 'all',
        resolver: yupResolver(formAddTermUserSchema),
    })

    /**
     * Handle submit form event
     */
    const onSubmit = useCallback(
        (data: FormAddTermUser) => {
            props.doAddTermUser(
                data.handle?.value ?? 0,
                data.handle?.label ?? '',
                () => {
                    props.setOpen(false)
                },
                () => {
                    reset({
                        // eslint-disable-next-line unicorn/no-null
                        handle: null, // only null will reset the handle field
                    })
                },
            )
        },
        [props.doAddTermUser, reset],
    )

    return (
        <BaseModal
            allowBodyScroll
            blockScroll
            title={`Sign Terms ${props.termInfo.title}`}
            onClose={handleClose}
            open={props.open}
            classNames={{
                modal: classNames(styles.modal),
            }}
        >
            <form
                className={classNames(styles.container, props.className)}
                onSubmit={handleSubmit(onSubmit)}
            >
                <div className={styles.blockForm}>
                    <Controller
                        name='handle'
                        control={control}
                        render={function render(controlProps: {
                            field: ControllerRenderProps<
                                FormAddTermUser,
                                'handle'
                            >
                        }) {
                            return (
                                <FieldHandleSelect
                                    label='Handle'
                                    value={controlProps.field.value}
                                    onChange={controlProps.field.onChange}
                                    onBlur={controlProps.field.onBlur}
                                    classNameWrapper={styles.inputField}
                                    disabled={props.isAdding}
                                    dirty
                                    error={_.get(errors, 'handle.message')}
                                />
                            )
                        }}
                    />
                </div>
                <div className={styles.actionButtons}>
                    <Button
                        secondary
                        size='lg'
                        onClick={handleClose}
                        disabled={props.isAdding}
                    >
                        Close
                    </Button>
                    <Button
                        type='submit'
                        primary
                        size='lg'
                        disabled={props.isAdding || !isValid || !isDirty}
                    >
                        Sign Terms
                    </Button>
                </div>

                {props.isAdding && (
                    <div className={styles.dialogLoadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}
            </form>
        </BaseModal>
    )
}

export default DialogAddTermUser
