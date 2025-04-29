/**
 * Role members filters ui.
 */
import { FC, useCallback } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import { Button, InputText } from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { FormRoleMembersFilters } from '../../models'
import { formRoleMembersFiltersSchema } from '../../utils'

import styles from './RoleMembersFilters.module.scss'

interface Props {
    className?: string
    onSubmitForm?: (filter: FormRoleMembersFilters) => void
    isLoading?: boolean
}

export const RoleMembersFilters: FC<Props> = props => {
    const {
        register,
        handleSubmit,
        formState: { isValid },
    }: UseFormReturn<FormRoleMembersFilters> = useForm({
        defaultValues: {},
        mode: 'all',
        resolver: yupResolver(formRoleMembersFiltersSchema),
    })
    const onSubmit = useCallback(
        (data: FormRoleMembersFilters) => {
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
                    name='userHandle'
                    label='User Handle'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('userHandle')}
                    disabled={props.isLoading}
                />
                <InputText
                    type='text'
                    name='email'
                    label='Email'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('email')}
                    disabled={props.isLoading}
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

export default RoleMembersFilters
