/**
 * Dialog edit user groups.
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

import {
    BaseModal,
    Button,
    InputSelectReact,
    LoadingSpinner,
    Table,
    TableColumn,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { FormEditUserGroup, UserGroup, UserInfo } from '../../models'
import { useManageUserGroups, useManageUserGroupsProps } from '../../hooks'
import { formEditUserGroupSchema } from '../../utils'

import styles from './DialogEditUserGroups.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
    userInfo: UserInfo
}

export const DialogEditUserGroups: FC<Props> = (props: Props) => {
    const {
        userGroups,
        isLoading: isFetching,
        isAdding,
        isRemoving,
        availableGroups,
        doAddGroup,
        doRemoveGroup,
    }: useManageUserGroupsProps = useManageUserGroups(props.userInfo)
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
    }: UseFormReturn<FormEditUserGroup> = useForm({
        defaultValues: {
            group: '',
        },
        mode: 'all',
        resolver: yupResolver(formEditUserGroupSchema),
    })
    const onSubmit = useCallback(
        (data: FormEditUserGroup) => {
            doAddGroup(data.group, () => {
                reset({
                    group: '',
                })
            })
        },
        [doAddGroup, reset],
    )
    const columns = useMemo<TableColumn<UserGroup>[]>(
        () => [
            {
                className: styles.tableCell,
                label: 'Group ID',
                propertyName: 'id',
                type: 'text',
            },
            {
                className: styles.tableCell,
                label: 'Name',
                propertyName: 'name',
                type: 'text',
            },
            {
                className: styles.blockAction,
                label: 'Action',
                renderer: (data: UserGroup) => (
                    <Button
                        primary
                        variant='danger'
                        label='Remove'
                        onClick={function onClick() {
                            doRemoveGroup(data)
                        }}
                        disabled={isRemoving[data.id]}
                    />
                ),
                type: 'action',
            },
        ],
        [isRemoving, doRemoveGroup],
    )

    const groupOptions = useMemo(
        () => [
            ...(availableGroups.length < 1
                ? [
                    {
                        label: 'No Groups',
                        value: '',
                    },
                ]
                : []),
            ...availableGroups.map(item => ({
                label: item.name,
                value: item.id,
            })),
        ],
        [availableGroups],
    )

    return (
        <BaseModal
            allowBodyScroll
            blockScroll
            title={`Groups of ${props.userInfo.handle}`}
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
                        {userGroups.length ? (
                            <Table
                                columns={columns}
                                data={userGroups}
                                disableSorting
                                onToggleSort={_.noop}
                            />
                        ) : (
                            <div>No groups</div>
                        )}
                    </>
                )}

                <form
                    className={styles.blockAdd}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <Controller
                        name='group'
                        control={control}
                        render={function render(controlProps: {
                            field: ControllerRenderProps<
                                FormEditUserGroup,
                                'group'
                            >
                        }) {
                            return (
                                <InputSelectReact
                                    name='group'
                                    label='Add group'
                                    placeholder='Select'
                                    options={groupOptions}
                                    value={controlProps.field.value}
                                    onChange={controlProps.field.onChange}
                                    classNameWrapper={styles.inputField}
                                    disabled={
                                        availableGroups.length < 1 || isAdding
                                    }
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

export default DialogEditUserGroups
