/**
 * Dialog edit user roles.
 */
import { FC, useCallback, useMemo } from 'react'
import { Controller, ControllerRenderProps, useForm, UseFormReturn } from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import {
    BaseModal,
    Button,
    InputSelectReact,
    LoadingSpinner,
    Table,
    TableColumn,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { useManageUserRoles, useManageUserRolesProps } from '../../hooks'
import { FormEditUserRole, UserInfo, UserRole } from '../../models'
import { formEditUserRoleSchema } from '../../utils'

import styles from './DialogEditUserRoles.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
    userInfo: UserInfo
}

export const DialogEditUserRoles: FC<Props> = (props: Props) => {
    const {
        availableRoles,
        isLoading: isFetching,
        isAdding,
        isRemoving,
        doAddRole,
        doRemoveRole,
        userRoles,
    }: useManageUserRolesProps = useManageUserRoles(props.userInfo)
    const isRemovingBool = useMemo(
        () => _.some(isRemoving, value => value === true),
        [isRemoving],
    )
    const isLoading = useMemo(
        () => isFetching || isAdding || isRemovingBool,
        [isFetching, isAdding, isRemovingBool],
    )
    const handleClose = useCallback(() => {
        if (!isLoading) {
            props.setOpen(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading])
    const {
        handleSubmit,
        reset,
        control,
        formState: { isValid },
    }: UseFormReturn<FormEditUserRole> = useForm({
        defaultValues: {
            role: '',
        },
        mode: 'all',
        resolver: yupResolver(formEditUserRoleSchema),
    })
    const onSubmit = useCallback(
        (data: FormEditUserRole) => {
            doAddRole(data.role, () => {
                reset({
                    role: '',
                })
            })
        },
        [doAddRole, reset],
    )

    const columns = useMemo<TableColumn<UserRole>[]>(
        () => [
            {
                className: styles.tableCell,
                label: 'Role ID',
                propertyName: 'id',
                type: 'text',
            },
            {
                className: styles.tableCell,
                label: 'Name',
                propertyName: 'roleName',
                type: 'text',
            },

            {
                className: styles.blockAction,
                label: 'Action',
                renderer: (data: UserRole) => (
                    <Button
                        primary
                        variant='danger'
                        label='Remove'
                        onClick={function onClick() {
                            doRemoveRole(String(data.id))
                        }}
                        disabled={isRemoving[data.id]}
                    />
                ),
                type: 'action',
            },
        ],
        [isRemoving, doRemoveRole],
    )

    const roleOptions = useMemo(
        () => [
            ...(availableRoles.length < 1
                ? [
                    {
                        label: 'No Roles',
                        value: '',
                    },
                ]
                : []),
            ...availableRoles.map(item => ({
                label: item.roleName,
                value: item.id,
            })),
        ],
        [availableRoles],
    )

    return (
        <BaseModal
            allowBodyScroll
            blockScroll
            title={`Roles of ${props.userInfo.handle}`}
            onClose={handleClose}
            open={props.open}
            focusTrapped={false}
            classNames={{
                modal: classNames(styles.modal),
            }}
        >
            <div className={classNames(styles.container, props.className)}>
                {isFetching ? (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                ) : (
                    <>
                        {userRoles.length ? (
                            <Table
                                columns={columns}
                                data={userRoles}
                                disableSorting
                                onToggleSort={_.noop}
                            />
                        ) : (
                            <div>No roles</div>
                        )}
                    </>
                )}

                <form
                    className={styles.blockAdd}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <Controller
                        name='role'
                        control={control}
                        render={function render(controlProps: {
                            field: ControllerRenderProps<
                                FormEditUserRole,
                                'role'
                            >
                        }) {
                            return (
                                <InputSelectReact
                                    name='role'
                                    label='Add role'
                                    placeholder='Select'
                                    options={roleOptions}
                                    value={controlProps.field.value}
                                    onChange={controlProps.field.onChange}
                                    classNameWrapper={styles.inputField}
                                    disabled={availableRoles.length < 1 || isAdding}
                                />
                            )
                        }}
                    />
                    <Button
                        primary
                        type='submit'
                        disabled={isAdding || !isValid}
                    >
                        Add
                    </Button>
                </form>
                <div className={styles.actionButtons}>
                    <Button
                        secondary
                        size='lg'
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Close
                    </Button>
                </div>

                {(isAdding || isRemovingBool) && (
                    <div className={styles.dialogLoadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}
            </div>
        </BaseModal>
    )
}

export default DialogEditUserRoles
