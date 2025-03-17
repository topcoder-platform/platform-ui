/**
 * Group members filters ui.
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

import { FormGroupMembersFilters } from '../../models'
import { formGroupMembersFiltersSchema } from '../../utils'

import styles from './GroupMembersFilters.module.scss'

interface Props {
    className?: string
    onSubmitForm?: (filter: FormGroupMembersFilters) => void
    isLoading?: boolean
    memberType: string
}

export const GroupMembersFilters: FC<Props> = props => {
    const {
        register,
        handleSubmit,
        control,
        formState: { isValid },
    }: UseFormReturn<FormGroupMembersFilters> = useForm({
        defaultValues: {},
        mode: 'all',
        resolver: yupResolver(formGroupMembersFiltersSchema),
    })
    const onSubmit = useCallback(
        (data: FormGroupMembersFilters) => {
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
                    name='memberId'
                    label={_.startCase(`${props.memberType} Id`)}
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('memberId')}
                />
                <InputText
                    type='text'
                    name='memberName'
                    label={_.startCase(`${props.memberType} Name`)}
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('memberName')}
                />
                <InputText
                    type='text'
                    name='createdBy'
                    label='Created By'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('createdBy')}
                />
                <InputText
                    type='text'
                    name='modifiedBy'
                    label='Modified By'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('modifiedBy')}
                />
                <Controller
                    name='createdAtFrom'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormGroupMembersFilters,
                            'createdAtFrom'
                        >
                    }) {
                        return (
                            <InputDatePicker
                                label='Create At From'
                                date={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                dirty
                                disabled={false}
                                maxDate={new Date()}
                                placeholder='Select date'
                                isClearable
                            />
                        )
                    }}
                />
                <Controller
                    name='createdAtTo'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormGroupMembersFilters,
                            'createdAtTo'
                        >
                    }) {
                        return (
                            <InputDatePicker
                                label='Create At To'
                                date={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                dirty
                                disabled={false}
                                maxDate={new Date()}
                                placeholder='Select date'
                                isClearable
                            />
                        )
                    }}
                />
                <Controller
                    name='modifiedAtFrom'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormGroupMembersFilters,
                            'modifiedAtFrom'
                        >
                    }) {
                        return (
                            <InputDatePicker
                                label='Modified At From'
                                date={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                dirty
                                disabled={false}
                                maxDate={new Date()}
                                placeholder='Select date'
                                isClearable
                            />
                        )
                    }}
                />
                <Controller
                    name='modifiedAtTo'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormGroupMembersFilters,
                            'modifiedAtTo'
                        >
                    }) {
                        return (
                            <InputDatePicker
                                label='Modified At To'
                                date={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                dirty
                                disabled={false}
                                maxDate={new Date()}
                                placeholder='Select date'
                                isClearable
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

export default GroupMembersFilters
