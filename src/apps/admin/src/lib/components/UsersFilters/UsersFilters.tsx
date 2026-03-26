/**
 * Users filters ui.
 */
import { FC, useCallback } from 'react'
import { Controller, ControllerRenderProps, useForm, UseFormReturn } from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import { Button, InputSelect, InputText } from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { USER_STATUS_SELECT_OPTIONS } from '../../../config/index.config'
import { FormUsersFilters } from '../../models'
import { formUsersFiltersSchema } from '../../utils'

import styles from './UsersFilters.module.scss'

interface Props {
    className?: string
    onFindMembers?: (filter: string) => void
    isLoading?: boolean
}

const defaultValues: FormUsersFilters = {
    email: '',
    handle: '',
    ssoUserId: '',
    status: undefined,
    userId: '',
}

function appendFilterValue(filter: string, key: string, value?: string | boolean): string {
    if (value === undefined || value === null || value === '') {
        return filter
    }

    const nextFilter = filter.length > 0 ? `${filter}&` : filter

    return `${nextFilter}${key}=${value}`
}

function getActiveFilterValue(status?: string): boolean | undefined {
    if (status === 'active') {
        return true
    }

    if (status === 'inactive') {
        return false
    }

    return undefined
}

export const UsersFilters: FC<Props> = props => {
    const {
        register,
        reset,
        handleSubmit,
        control,
        formState: { errors, isValid, isDirty },
    }: UseFormReturn<FormUsersFilters> = useForm({
        defaultValues,
        mode: 'all',
        resolver: yupResolver(formUsersFiltersSchema),
    })
    const onSubmit = useCallback(
        (data: FormUsersFilters) => {
            const {
                handle,
                email,
                ssoUserId,
                status,
                userId,
            }: FormUsersFilters = data
            const active = getActiveFilterValue(status)
            const like = [handle, email, ssoUserId].some(
                value => value?.includes('*') === true,
            )

            let filter = ''

            filter = appendFilterValue(filter, 'handle', handle)
            filter = appendFilterValue(filter, 'email', email)
            filter = appendFilterValue(filter, 'ssoUserId', ssoUserId)
            filter = appendFilterValue(filter, 'active', active)
            filter = appendFilterValue(filter, 'like', like ? String(like) : undefined)
            filter = appendFilterValue(filter, 'id', userId)

            props.onFindMembers?.(filter)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.onFindMembers],
    )

    return (
        <form
            className={classNames(styles.container, props.className)}
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className={styles.fields}>
                <InputText
                    type='text'
                    name='handle'
                    label='Handle'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('handle')}
                />
                <InputText
                    type='text'
                    name='email'
                    label='Email'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    error={_.get(errors, 'email.message')}
                    inputControl={register('email')}
                    dirty
                />
                <InputText
                    type='text'
                    name='ssoUserId'
                    label='SSO UserID'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('ssoUserId')}
                />
                <InputText
                    type='text'
                    name='userId'
                    label='User Id'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('userId')}
                />
                <Controller
                    name='status'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<FormUsersFilters>
                    }) {
                        return (
                            <InputSelect
                                name='status'
                                label='Status'
                                placeholder='Select'
                                options={USER_STATUS_SELECT_OPTIONS}
                                value={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                classNameWrapper={styles.field}
                            />
                        )
                    }}
                />
            </div>

            <div className={styles.blockBottom}>
                <p className={styles.textTips}>
                    Tips:
                    <br />
                    - Wildcard(*) is available for partial matching on Handle, Email, and SSO
                    UserID. (e.g. ChrisB*, j*@wipro.com)
                    <br />
                    - Maximum number of searched results is 500.
                </p>

                <div className={styles.blockBtns}>
                    <Button
                        primary
                        className={styles.searchButton}
                        size='lg'
                        type='submit'
                        disabled={!isValid || props.isLoading}
                    >
                        Find members
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
            </div>
        </form>
    )
}

export default UsersFilters
