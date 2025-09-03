/**
 * Terms Users Filters.
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

import { Button, InputDatePicker, InputText } from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { formTermsUsersFilterSchema } from '../../utils'
import { FormTermsUsersFilter } from '../../models'

import styles from './TermsUsersFilters.module.scss'

interface Props {
    className?: string
    isLoading: boolean
    onSubmitForm?: (data: FormTermsUsersFilter) => void
}

const defaultValues: FormTermsUsersFilter = {
    handle: '',
    signTermsFrom: undefined,
    signTermsTo: undefined,
    userId: '',
}

export const TermsUsersFilters: FC<Props> = (props: Props) => {
    const {
        register,
        reset,
        handleSubmit,
        control,
        formState: { isValid, isDirty },
    }: UseFormReturn<FormTermsUsersFilter> = useForm({
        defaultValues,
        mode: 'all',
        resolver: yupResolver(formTermsUsersFilterSchema),
    })

    /**
     * Handle submit form event
     */
    const onSubmit = useCallback(
        (data: FormTermsUsersFilter) => {
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
                    name='userId'
                    label='User Id'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('userId')}
                    disabled={props.isLoading}
                />
                <InputText
                    type='text'
                    name='handle'
                    label='Handle'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('handle')}
                    disabled={props.isLoading}
                />
                <Controller
                    name='signTermsFrom'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormTermsUsersFilter,
                            'signTermsFrom'
                        >
                    }) {
                        return (
                            <InputDatePicker
                                label='Signed From'
                                date={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                onBlur={controlProps.field.onBlur}
                                dirty
                                placeholder='Select date'
                                isClearable
                                disabled={props.isLoading ?? false}
                            />
                        )
                    }}
                />
                <Controller
                    name='signTermsTo'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormTermsUsersFilter,
                            'signTermsTo'
                        >
                    }) {
                        return (
                            <InputDatePicker
                                label='Signed To'
                                date={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                onBlur={controlProps.field.onBlur}
                                dirty
                                placeholder='Select date'
                                isClearable
                                disabled={props.isLoading ?? false}
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

export default TermsUsersFilters
