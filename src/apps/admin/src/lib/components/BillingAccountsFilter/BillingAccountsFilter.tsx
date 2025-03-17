/**
 * Billing accounts filter.
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
import { FormBillingAccountsFilter } from '../../models'
import { formBillingAccountsFilterSchema } from '../../utils'

import styles from './BillingAccountsFilter.module.scss'

interface Props {
    className?: string
    isLoading?: boolean
    onSubmitForm?: (data: FormBillingAccountsFilter) => void
}

export const BillingAccountsFilter: FC<Props> = (props: Props) => {
    const maxDate = useMemo(() => moment()
        .add(20, 'y')
        .toDate(), [])
    const {
        register,
        handleSubmit,
        control,
        formState: { isValid },
    }: UseFormReturn<FormBillingAccountsFilter> = useForm({
        defaultValues: {
            status: '1',
        },
        mode: 'all',
        resolver: yupResolver(formBillingAccountsFilterSchema),
    })
    const onSubmit = useCallback(
        (data: FormBillingAccountsFilter) => {
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
                <InputText
                    type='text'
                    name='user'
                    label='User'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('user')}
                    disabled={props.isLoading}
                />
                <Controller
                    name='status'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormBillingAccountsFilter,
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
                            FormBillingAccountsFilter,
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
                                classNameWrapper={styles.fieldDate}
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
                            FormBillingAccountsFilter,
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
                                classNameWrapper={styles.fieldDate}
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
            </div>
        </form>
    )
}

export default BillingAccountsFilter
