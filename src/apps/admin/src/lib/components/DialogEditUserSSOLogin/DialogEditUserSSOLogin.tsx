/**
 * Dialog edit user groups.
 */
import { FC, useCallback, useMemo, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import {
    BaseModal,
    Button,
    LoadingSpinner,
    Table,
    TableColumn,
} from '~/libs/ui'
import { useWindowSize, WindowSize } from '~/libs/shared'

import {
    MobileTableColumn,
    SSOLoginProvider,
    SSOUserLogin,
    UserInfo,
} from '../../models'
import { useManageUserSSOLogin, useManageUserSSOLoginProps } from '../../hooks'
import { FormAddSSOLogin } from '../FormAddSSOLogin'
import { FormAddSSOLoginData } from '../../models/FormAddSSOLoginData.model'
import { TableMobile } from '../common/TableMobile'

import styles from './DialogEditUserSSOLogin.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
    userInfo: UserInfo
    providers: SSOLoginProvider[]
}

export const DialogEditUserSSOLogin: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 900, [screenWidth])
    const {
        ssoUserLogins,
        isLoading: isFetching,
        isAdding,
        isRemoving,
        doAddSSOUserLogin,
        doUpdateSSOUserLogin,
        doRemoveSSOUserLogin,
    }: useManageUserSSOLoginProps = useManageUserSSOLogin(props.userInfo)
    const isRemovingBool = useMemo(
        () => _.some(isRemoving, value => value === true),
        [isRemoving],
    )
    const isLoading = useMemo(
        () => isFetching || isAdding || isRemovingBool,
        [isFetching, isAdding, isRemovingBool],
    )

    const [showAddForm, setShowAddForm] = useState(false)
    const [showEditForm, setShowEditForm] = useState<SSOUserLogin>()

    const handleClose = useCallback(() => {
        if (!isLoading) {
            props.setOpen(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading])
    const columns = useMemo<TableColumn<SSOUserLogin>[]>(
        () => [
            {
                className: styles.tableCell,
                label: 'User ID',
                propertyName: 'userId',
                type: 'text',
            },
            {
                className: styles.tableCell,
                label: 'Name',
                propertyName: 'name',
                type: 'text',
            },
            {
                className: styles.tableCell,
                label: 'Provider',
                propertyName: 'provider',
                type: 'text',
            },
            {
                className: styles.tableCell,
                label: 'Email',
                propertyName: 'email',
                type: 'text',
            },
            {
                className: styles.blockAction,
                label: 'Actions',
                renderer: (data: SSOUserLogin) => (
                    <div className={styles.btnActions}>
                        <Button
                            primary
                            variant='danger'
                            label='Remove'
                            onClick={function onClick() {
                                doRemoveSSOUserLogin(data)
                            }}
                            disabled={isRemoving[data.provider]}
                        />
                        <Button
                            primary
                            label='Edit'
                            onClick={function onClick() {
                                setShowEditForm(data)
                            }}
                            disabled={isAdding}
                        />
                    </div>
                ),
                type: 'action',
            },
        ],
        [isAdding, isRemoving, doRemoveSSOUserLogin],
    )

    const columnsMobile = useMemo<MobileTableColumn<SSOUserLogin>[][]>(
        () => columns.map(column => {
            if (column.label === 'Actions') {
                return [
                    {
                        ...column,
                        colSpan: 2,
                        mobileType: 'last-value',
                    },
                ]
            }

            return [
                {
                    ...column,
                    className: '',
                    label: `${column.label as string} label`,
                    mobileType: 'label',
                    renderer: () => (
                        <div>
                            {column.label as string}
                            :
                        </div>
                    ),
                    type: 'element',
                },
                {
                    ...column,
                    mobileType: 'last-value',
                },
            ]
        }),
        [columns],
    )

    const cancelEditForm = useCallback(() => {
        setShowEditForm(undefined)
        setShowAddForm(false)
    }, [setShowAddForm, setShowEditForm])

    return (
        <BaseModal
            allowBodyScroll
            blockScroll
            title={`SSO Logins of ${props.userInfo.handle}`}
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
                        {ssoUserLogins.length ? (
                            <>
                                {isTablet ? (
                                    <TableMobile
                                        columns={columnsMobile}
                                        data={ssoUserLogins}
                                        className={styles.mobileTable}
                                    />
                                ) : (
                                    <Table
                                        columns={columns}
                                        data={ssoUserLogins}
                                        disableSorting
                                        onToggleSort={_.noop}
                                        className={styles.desktopTable}
                                    />
                                )}
                            </>
                        ) : (
                            <div>No SSO logins</div>
                        )}
                    </>
                )}

                {showAddForm || showEditForm ? (
                    <FormAddSSOLogin
                        isAdding={isAdding}
                        onSubmit={function onSubmit(data: FormAddSSOLoginData) {
                            if (showAddForm) {
                                doAddSSOUserLogin(data, cancelEditForm)
                            } else {
                                doUpdateSSOUserLogin(data, cancelEditForm)
                            }
                        }}
                        onCancel={cancelEditForm}
                        providers={props.providers}
                        editingData={showEditForm}
                    />
                ) : (
                    <Button
                        primary
                        type='submit'
                        onClick={function onClick() {
                            setShowAddForm(true)
                        }}
                    >
                        Add
                    </Button>
                )}
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

export default DialogEditUserSSOLogin
