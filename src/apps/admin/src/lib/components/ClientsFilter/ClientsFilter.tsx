/**
 * Clients filter.
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

import { Button, InputDatePicker, InputSelect, InputText } from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { BILLING_ACCOUNT_STATUS_FILTER_OPTIONS } from '../../../config/index.config'
import { FormClientsFilter } from '../../models'
import { formClientsFilterSchema } from '../../utils'

import styles from './ClientsFilter.module.scss'

interface Props {
    className?: string
    isLoading?: boolean
    onSubmitForm?: (data: FormClientsFilter) => void
}

const defaultValues: FormClientsFilter = {
    endDate: undefined,
    name: '',
    startDate: undefined,
    status: '1',
}

export const ClientsFilter: FC<Props> = (props: Props) => {
    const maxDate = useMemo(() => moment()
        .add(20, 'y')
        .toDate(), [])
    const {
        register,
        reset,
        handleSubmit,
        control,
        formState: { isValid, isDirty },
    }: UseFormReturn<FormClientsFilter> = useForm({
        defaultValues,
        mode: 'all',
        resolver: yupResolver(formClientsFilterSchema),
    })
    const onSubmit = useCallback(
        (data: FormClientsFilter) => {
            props.onSubmitForm?.(data)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.onSubmitForm],
    )

    return (
        <form
            className={classNames(styles.container, props.className)}
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className={styles.fields}>
                <InputText
                    type='text'
                    name='name'
                    label='Name'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('name')}
                    disabled={props.isLoading}
                />
                <Controller
                    name='status'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormClientsFilter,
                            'status'
                        >
                    }) {
                        return (
                            <InputSelect
                                name='status'
                                label='Status'
                                placeholder='Select status'
                                options={BILLING_ACCOUNT_STATUS_FILTER_OPTIONS}
                                value={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                classNameWrapper={styles.field}
                                disabled={props.isLoading}
                            />
                        )
                    }}
                />
                <Controller
                    name='startDate'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormClientsFilter,
                            'startDate'
                        >
                    }) {
                        return (
                            <InputDatePicker
                                label='Start Date'
                                date={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                dirty
                                placeholder='Select date'
                                isClearable
                                disabled={props.isLoading ?? false}
                                maxDate={maxDate}
                            />
                        )
                    }}
                />
                <Controller
                    name='endDate'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormClientsFilter,
                            'endDate'
                        >
                    }) {
                        return (
                            <InputDatePicker
                                label='End Date'
                                date={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                dirty
                                placeholder='Select date'
                                isClearable
                                disabled={props.isLoading ?? false}
                                maxDate={maxDate}
                            />
                        )
                    }}
                />
            </div>

            <div className={styles.blockBottom}>
                <Button
                    primary
                    className={styles.searchButton}
                    size='lg'
                    type='submit'
                    disabled={!isValid || props.isLoading}
                >
                    Filter
                </Button>
                <Button
                    secondary
                    onClick={function onClick() {
                        reset(defaultValues)
                        setTimeout(() => {
                            onSubmit(defaultValues)
                        })
                    }}
                    size='lg'
                    disabled={!isDirty}
                >
                    Reset
                </Button>
            </div>
        </form>
    )
}

export default ClientsFilter
