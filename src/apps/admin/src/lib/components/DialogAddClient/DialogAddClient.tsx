/**
 * Dialog add client.
 */
import { FC, useCallback, useMemo } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'
import moment from 'moment'

import {
    BaseModal,
    Button,
    InputDatePicker,
    InputSelect,
    InputText,
    LoadingSpinner,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { BILLING_ACCOUNT_STATUS_EDIT_OPTIONS } from '../../../config/index.config'
import { FormEditClient } from '../../models'
import { formEditClientSchema } from '../../utils'
import { useManageAddClient, useManageAddClientProps } from '../../hooks'

import styles from './DialogAddClient.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
    onAdded?: () => void
}

export const DialogAddClient: FC<Props> = (props: Props) => {
    const maxDate = useMemo(() => moment()
        .add(20, 'y')
        .toDate(), [])
    const {
        isAdding,
        doAddClientInfo,
    }: useManageAddClientProps = useManageAddClient('')

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isDirty },
        watch,
        reset,
    }: UseFormReturn<FormEditClient> = useForm({
        defaultValues: {
            codeName: '',
            endDate: undefined,
            name: '',
            startDate: undefined,
            status: 'ACTIVE',
        },
        mode: 'all',
        resolver: yupResolver(formEditClientSchema),
    })

    const endDate = watch('endDate')
    const startDate = watch('startDate')
    const maxStartDate = useMemo(
        () => (endDate ?? maxDate),
        [maxDate, endDate],
    )
    const minEndDate = useMemo(
        () => (startDate ?? new Date()),
        [startDate],
    )

    const handleClose = useCallback(() => {
        if (!isAdding) {
            props.setOpen(false)
        }
    }, [isAdding, props])

    const onSubmit = useCallback((data: FormEditClient) => {
        doAddClientInfo(data, () => {
            props.onAdded?.()
            reset()
            props.setOpen(false)
        })
    }, [doAddClientInfo, props, reset])

    return (
        <BaseModal
            allowBodyScroll
            blockScroll
            title='Add Client'
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
                        name='name'
                        label='Name'
                        placeholder='Enter'
                        tabIndex={0}
                        onChange={_.noop}
                        inputControl={register('name')}
                        error={_.get(errors, 'name.message')}
                        dirty
                        disabled={isAdding}
                    />
                    <InputText
                        type='text'
                        name='codeName'
                        label='Code Name'
                        placeholder='Enter'
                        tabIndex={0}
                        onChange={_.noop}
                        inputControl={register('codeName')}
                        error={_.get(errors, 'codeName.message')}
                        dirty
                        disabled={isAdding}
                    />
                    <Controller
                        name='startDate'
                        control={control}
                        render={function render(controlProps: {
                            field: ControllerRenderProps<
                                FormEditClient,
                                'startDate'
                            >
                        }) {
                            return (
                                <InputDatePicker
                                    label='Start Date'
                                    date={controlProps.field.value}
                                    onChange={controlProps.field.onChange}
                                    placeholder='Select date'
                                    isClearable
                                    error={_.get(errors, 'startDate.message')}
                                    maxDate={maxStartDate}
                                    dirty
                                    disabled={isAdding}
                                />
                            )
                        }}
                    />
                    <Controller
                        name='endDate'
                        control={control}
                        render={function render(controlProps: {
                            field: ControllerRenderProps<
                                FormEditClient,
                                'endDate'
                            >
                        }) {
                            return (
                                <InputDatePicker
                                    label='End Date'
                                    date={controlProps.field.value}
                                    onChange={controlProps.field.onChange}
                                    placeholder='Select date'
                                    isClearable
                                    error={_.get(errors, 'endDate.message')}
                                    minDate={minEndDate}
                                    maxDate={maxDate}
                                    dirty
                                    disabled={isAdding}
                                />
                            )
                        }}
                    />
                    <Controller
                        name='status'
                        control={control}
                        render={function render(controlProps: {
                            field: ControllerRenderProps<
                                FormEditClient,
                                'status'
                            >
                        }) {
                            return (
                                <InputSelect
                                    name='status'
                                    label='Status'
                                    placeholder='Select'
                                    options={BILLING_ACCOUNT_STATUS_EDIT_OPTIONS}
                                    value={controlProps.field.value}
                                    onChange={controlProps.field.onChange}
                                    error={_.get(errors, 'status.message')}
                                    dirty
                                    disabled={isAdding}
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
                        disabled={isAdding}
                    >
                        Close
                    </Button>
                    <Button
                        type='submit'
                        primary
                        size='lg'
                        disabled={isAdding || !isDirty}
                    >
                        Save
                    </Button>
                </div>
                {isAdding && (
                    <div className={styles.dialogLoadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}
            </form>
        </BaseModal>
    )
}

export default DialogAddClient
