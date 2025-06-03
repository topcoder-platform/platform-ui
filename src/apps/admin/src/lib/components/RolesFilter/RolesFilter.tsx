/**
 * Roles filter ui.
 */
import { FC, useCallback, useEffect } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import { Button, InputText } from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { FormRolesFilter, TableRolesFilter } from '../../models'
import { formRolesFilterSchema } from '../../utils'

import styles from './RolesFilter.module.scss'

interface Props {
    className?: string
    isLoading?: boolean
    isAdding?: boolean
    setFilters: (filterDatas: TableRolesFilter) => void
    doAddRole: (roleName: string, success: () => void) => void
}

const defaultValues: FormRolesFilter = {
    roleName: '',
}

export const RolesFilter: FC<Props> = props => {
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { isValid },
    }: UseFormReturn<FormRolesFilter> = useForm({
        defaultValues: {
            roleName: '',
        },
        mode: 'all',
        resolver: yupResolver(formRolesFilterSchema),
    })
    const onSubmit = useCallback(
        (data: FormRolesFilter) => {
            props.doAddRole(data.roleName, () => {
                reset({
                    roleName: '',
                })
            })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.doAddRole],
    )

    const roleName = watch('roleName')

    useEffect(() => {
        props.setFilters({
            roleName,
        })
    }, [roleName]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <form
            className={classNames(styles.container, props.className)}
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className={styles.fields}>
                <InputText
                    type='text'
                    name='role'
                    label='Search/create role'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('roleName')}
                />

                <div className={styles.blockBottom}>
                    <Button
                        primary
                        className={styles.searchButton}
                        size='lg'
                        type='submit'
                        disabled={!isValid || props.isLoading || props.isAdding}
                    >
                        Create Role
                    </Button>
                    <Button
                        primary
                        className={styles.searchButton}
                        size='lg'
                        type='submit'
                        variant='danger'
                        onClick={function onClick() {
                            reset(defaultValues)
                        }}
                    >
                        Clear
                    </Button>
                </div>
            </div>
        </form>
    )
}

export default RolesFilter
