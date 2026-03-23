/**
 * Users table.
 */
import { FC, useEffect, useMemo, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import moment from 'moment'

import { Sort } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'
import { EnvironmentConfig } from '~/config'
import { useWindowSize, WindowSize } from '~/libs/shared'
import {
    Button,
    colWidthType,
    ConfirmModal,
    IconOutline,
    IconSolid,
    Table,
    TableColumn,
} from '~/libs/ui'

import { CopyButton } from '../CopyButton'
import { DialogEditUserEmail } from '../DialogEditUserEmail'
import { DialogEditUserHandle } from '../DialogEditUserHandle'
import { DialogEditUserRoles } from '../DialogEditUserRoles'
import { DialogEditUserGroups } from '../DialogEditUserGroups'
import { DialogEditUserSSOLogin } from '../DialogEditUserSSOLogin'
import { DialogEditUserTerms } from '../DialogEditUserTerms'
import { DialogEditUserStatus } from '../DialogEditUserStatus'
import { DialogUserStatusHistory } from '../DialogUserStatusHistory'
import { DialogDeleteUser } from '../DialogDeleteUser'
import { DropdownMenuButton } from '../common/DropdownMenuButton'
import { TABLE_DATE_FORMAT } from '../../../config/index.config'
import { SSOLoginProvider, UserInfo } from '../../models'
import { fetchSSOLoginProviders } from '../../services'
import { Pagination } from '../common/Pagination'
import { ReactComponent as RectangleListRegularIcon } from '../../assets/i/rectangle-list-regular-icon.svg'

import styles from './UsersTable.module.scss'

const userSortCollator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
})

/**
 * Resolves the value rendered by a sortable user column.
 * @param data User row to inspect.
 * @param fieldName Column field name requested by the table.
 * @returns Comparable scalar value for the requested column.
 */
function getUserSortValue(
    data: UserInfo,
    fieldName: string,
): boolean | Date | number | string | undefined {
    switch (fieldName) {
        case 'activationCode':
            return data.credential?.activationCode
        case 'firstName':
            return `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim()
        default:
            return (data as unknown as Record<string, boolean | Date | number | string | undefined>)[fieldName]
    }
}

/**
 * Checks whether a sortable value should be treated as empty.
 * @param value Candidate sort value.
 * @returns True when the value should remain at the bottom of the table.
 */
function isEmptySortValue(
    value: boolean | Date | number | string | undefined,
): boolean {
    return value === undefined || value === null || value === ''
}

/**
 * Compares two non-empty user sort values.
 * @param leftValue Left-hand sort value.
 * @param rightValue Right-hand sort value.
 * @param directionMultiplier Asc/desc multiplier.
 * @returns Standard Array.sort comparison result.
 */
function compareUserSortValues(
    leftValue: boolean | Date | number | string,
    rightValue: boolean | Date | number | string,
    directionMultiplier: number,
): number {
    if (leftValue instanceof Date && rightValue instanceof Date) {
        return directionMultiplier * (leftValue.getTime() - rightValue.getTime())
    }

    if (typeof leftValue === 'boolean' && typeof rightValue === 'boolean') {
        return directionMultiplier * (Number(leftValue) - Number(rightValue))
    }

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return directionMultiplier * (leftValue - rightValue)
    }

    return directionMultiplier * userSortCollator.compare(
        String(leftValue),
        String(rightValue),
    )
}

/**
 * Sorts one page of users while keeping empty values at the end.
 * @param users Current page of users.
 * @param sort Active sort requested by the table.
 * @returns Sorted copy of the current page.
 */
function sortUsers(
    users: UserInfo[],
    sort: Sort | undefined,
): UserInfo[] {
    if (!sort?.fieldName) {
        return users
    }

    const directionMultiplier = sort.direction === 'asc' ? 1 : -1

    return [...users].sort((left, right) => {
        const leftValue = getUserSortValue(left, sort.fieldName)
        const rightValue = getUserSortValue(right, sort.fieldName)
        const leftEmpty = isEmptySortValue(leftValue)
        const rightEmpty = isEmptySortValue(rightValue)

        if (leftEmpty && rightEmpty) {
            return 0
        }

        if (leftEmpty) {
            return 1
        }

        if (rightEmpty) {
            return -1
        }

        const normalizedLeftValue = leftValue as boolean | Date | number | string
        const normalizedRightValue = rightValue as boolean | Date | number | string

        return compareUserSortValues(
            normalizedLeftValue,
            normalizedRightValue,
            directionMultiplier,
        )
    })
}

interface Props {
    className?: string
    allUsers: UserInfo[]
    page: number
    sort: Sort | undefined
    totalPages: number
    onPageChange: (page: number) => void
    onSortChange: (sort: Sort | undefined) => void
    updatingStatus: { [key: string]: boolean }
    deletingUsers: { [key: string]: boolean }
    doUpdateStatus: (
        userInfo: UserInfo,
        newStatus: string,
        comment: string,
        onSuccess?: () => void,
    ) => void
    doDeleteUser: (
        userInfo: UserInfo,
        ticketUrl: string,
        onSuccess?: () => void,
    ) => void
}

export const UsersTable: FC<Props> = props => {
    const [colWidth, setColWidth] = useState<colWidthType>({})
    const [ssoLoginProviders, setSsoLoginProviders] = useState<SSOLoginProvider[]>([])
    // initial fallback values from environment, until remote loads
    useEffect(() => {
        if (EnvironmentConfig.ADMIN_SSO_LOGIN_PROVIDERS?.length) {
            setSsoLoginProviders(EnvironmentConfig.ADMIN_SSO_LOGIN_PROVIDERS.map(p => ({ ...p })))
        }
    }, [])
    // Fetch providers from identity-api on mount
    useEffect(() => {
        fetchSSOLoginProviders()
            .then((list: SSOLoginProvider[]) => {
                if (Array.isArray(list) && list.length) {
                    setSsoLoginProviders(list)
                }
            })
            .catch(() => {
                // ignore and keep fallback from env
            })
    }, [])
    const [showDialogEditUserEmail, setShowDialogEditUserEmail] = useState<
        UserInfo | undefined
    >()
    const [showDialogEditUserHandle, setShowDialogEditUserHandle] = useState<
        UserInfo | undefined
    >()
    const [showDialogEditUserRoles, setShowDialogEditUserRoles] = useState<
        UserInfo | undefined
    >()
    const [showDialogEditUserGroups, setShowDialogEditUserGroups] = useState<
        UserInfo | undefined
    >()
    const [showDialogEditUserSSOLogin, setShowDialogEditSSOLogin] = useState<
        UserInfo | undefined
    >()
    const [showDialogEditUserTerms, setShowDialogEditUserTerms] = useState<
        UserInfo | undefined
    >()
    const [showDialogEditUserStatus, setShowDialogEditUserStatus] = useState<
        UserInfo | undefined
    >()
    const [showDialogActivate, setShowDialogActivate] = useState<
        | {
              data: UserInfo
              message: string
          }
        | undefined
    >()
    const [showDialogStatusHistory, setShowDialogStatusHistory] = useState<
        UserInfo | undefined
    >()
    const [showDialogDeleteUser, setShowDialogDeleteUser] = useState<
        UserInfo | undefined
    >()
    const { width: screenWidth }: WindowSize = useWindowSize()

    const updatingStatusBool = useMemo(
        () => _.some(props.updatingStatus, value => value === true),
        [props.updatingStatus],
    )

    const isTablet = useMemo(() => screenWidth <= 984, [screenWidth])
    const isMobile = useMemo(() => screenWidth <= 745, [screenWidth])

    const results = useMemo(
        () => sortUsers(props.allUsers ?? [], props.sort),
        [props.allUsers, props.sort],
    )
    const columns = useMemo<TableColumn<UserInfo>[]>(
        () => [
            {
                columnId: 'id',
                label: 'User ID',
                propertyName: 'id',
                type: 'text',
            },
            {
                className: styles.blockColumnHandle,
                columnId: 'handle',
                label: 'Handle',
                propertyName: 'handle',
                type: 'text',
            },
            ...(isTablet
                ? [
                    {
                        columnId: 'email',
                        isExpand: true,
                        label: 'Primary Email',
                        propertyName: 'email',
                        type: 'text',
                    } as TableColumn<UserInfo>,
                    {
                        columnId: 'ssoUserId',
                        isExpand: true,
                        label: 'SSO UserID',
                        propertyName: 'ssoUserId',
                        type: 'text',
                    } as TableColumn<UserInfo>,
                ]
                : [
                    {
                        columnId: 'email',
                        label: 'Primary Email',
                        propertyName: 'email',
                        type: 'text',
                    } as TableColumn<UserInfo>,
                    {
                        columnId: 'ssoUserId',
                        label: 'SSO UserID',
                        propertyName: 'ssoUserId',
                        type: 'text',
                    } as TableColumn<UserInfo>,
                ]),
            {
                columnId: 'firstName',
                isExpand: true,
                label: 'Name',
                propertyName: 'firstName',
                renderer: (data: UserInfo) => (
                    <div>
                        {data.firstName}
                        {' '}
                        {data.lastName}
                    </div>
                ),
                type: 'element',
            },
            {
                columnId: 'statusDesc',
                isExpand: true,
                label: 'User Status',
                propertyName: 'statusDesc',
                renderer: (data: UserInfo) => (
                    <div className={styles.blockStatusContent}>
                        <span>{data.statusDesc}</span>
                        <button
                            type='button'
                            onClick={function onClick() {
                                setShowDialogStatusHistory(data)
                            }}
                            className={styles.btnShowDialogStatusHistory}
                        >
                            <RectangleListRegularIcon className='icon icon-fill' />
                        </button>
                    </div>
                ),
                type: 'element',
            },
            {
                columnId: 'emailStatusDesc',
                isExpand: true,
                label: 'Email Status',
                propertyName: 'emailStatusDesc',
                type: 'text',
            },
            {
                columnId: 'createdAt',
                isExpand: true,
                label: 'Created at',
                propertyName: 'createdAt',
                renderer: (data: UserInfo) => (
                    <div>
                        {moment(data.createdAt)
                            .local()
                            .format(TABLE_DATE_FORMAT)}
                    </div>
                ),
                type: 'element',
            },
            {
                columnId: 'modifiedAt',
                isExpand: true,
                label: 'Modified at',
                propertyName: 'modifiedAt',
                renderer: (data: UserInfo) => (
                    <div>
                        {moment(data.modifiedAt)
                            .local()
                            .format(TABLE_DATE_FORMAT)}
                    </div>
                ),
                type: 'element',
            },
            {
                columnId: 'activationCode',
                isExpand: true,
                label: 'Activation Code',
                propertyName: 'activationCode',
                renderer: (data: UserInfo) => {
                    const activationCode = data.credential?.activationCode ?? ''
                    const activationLink = data.activationLink ?? ''

                    return (
                        <div className={styles.blockActivationCode}>
                            {!!activationCode && (
                                <span className={styles.textActivationCode}>{activationCode}</span>
                            )}

                            <div className={styles.blockActivationCodeLink}>
                                <input
                                    type='text'
                                    value={activationLink}
                                    readOnly
                                    className={styles.blockActivationCodeInput}
                                />

                                <CopyButton
                                    text={activationLink}
                                    className={styles.btnCopy}
                                />
                            </div>
                        </div>
                    )
                },
                type: 'element',
            },
            ...(isMobile
                ? [
                    {
                        columnId: 'active',
                        isExpand: true,
                        label: 'User Active',
                        propertyName: 'active',
                        renderer: (data: UserInfo) => (
                            <>
                                {data.active && (
                                    <IconOutline.CheckIcon
                                        className={styles.iconCheck}
                                        width={26}
                                    />
                                )}
                            </>
                        ),
                        type: 'element',
                    } as TableColumn<UserInfo>,
                ]
                : [
                    {
                        columnId: 'active',
                        label: 'User Active',
                        propertyName: 'active',
                        renderer: (data: UserInfo) => (
                            <>
                                {data.active && (
                                    <IconOutline.CheckIcon
                                        className={styles.iconCheck}
                                        width={26}
                                    />
                                )}
                            </>
                        ),
                        type: 'element',
                    } as TableColumn<UserInfo>,
                ]),
            {
                className: styles.blockColumnAction,
                columnId: 'Action',
                label: 'Action',
                renderer: (data: UserInfo) => {
                    const isDeleting = props.deletingUsers?.[data.id] === true

                    function onSelectOption(item: string): void {
                        if (item === 'Primary Email') {
                            setShowDialogEditUserEmail(data)
                        } else if (item === 'Change Handle') {
                            setShowDialogEditUserHandle(data)
                        } else if (item === 'Roles') {
                            setShowDialogEditUserRoles(data)
                        } else if (item === 'Groups') {
                            setShowDialogEditUserGroups(data)
                        } else if (item === 'Terms') {
                            setShowDialogEditUserTerms(data)
                        } else if (item === 'SSO Logins') {
                            setShowDialogEditSSOLogin(data)
                        } else if (item === 'Deactivate') {
                            setShowDialogEditUserStatus(data)
                        } else if (item === 'Activate') {
                            const isEmailVerified
                                = data.emailVerified ?? data.emailActive ?? false

                            let confirmation = `Are you sure you want to activate user '${data.handle}'?`
                            if (!isEmailVerified) {
                                confirmation
                                  += "\nEmail address is also verified by the operation. Please confirm it's valid."
                            }

                            setShowDialogActivate({
                                data,
                                message: confirmation,
                            })
                        } else if (item === 'Delete') {
                            setShowDialogDeleteUser(data)
                        }
                    }

                    return (
                        <div className={styles.blockBtns}>
                            {isTablet ? (
                                <DropdownMenuButton
                                    options={[
                                        'Primary Email',
                                        'Change Handle',
                                        'Roles',
                                        'Groups',
                                        'Terms',
                                        'SSO Logins',
                                        ...(data.active
                                            ? ['Deactivate', 'Delete']
                                            : ['Activate', 'Delete']),
                                    ]}
                                    onSelectOption={onSelectOption}
                                >
                                    <button type='button'>
                                        <IconOutline.DotsHorizontalIcon
                                            width={15}
                                        />
                                    </button>
                                </DropdownMenuButton>
                            ) : (
                                <>
                                    <DropdownMenuButton
                                        options={[
                                            'Primary Email',
                                            'Change Handle',
                                            'Roles',
                                            'Groups',
                                            'Terms',
                                            'SSO Logins',
                                        ]}
                                        onSelectOption={onSelectOption}
                                    >
                                        <Button
                                            iconToRight
                                            icon={IconSolid.ChevronDownIcon}
                                            primary
                                        >
                                            Edit
                                        </Button>
                                    </DropdownMenuButton>
                                    {data.active ? (
                                        <Button
                                            primary
                                            variant='danger'
                                            label='Deactivate'
                                            onClick={function onClick() {
                                                onSelectOption('Deactivate')
                                            }}
                                            disabled={isDeleting}
                                        />
                                    ) : (
                                        <Button
                                            primary
                                            variant='linkblue'
                                            label='Activate'
                                            onClick={function onClick() {
                                                onSelectOption('Activate')
                                            }}
                                        />
                                    )}
                                    <Button
                                        primary
                                        variant='danger'
                                        label='Delete'
                                        onClick={function onClick() {
                                            onSelectOption('Delete')
                                        }}
                                        disabled={isDeleting}
                                    />
                                </>
                            )}
                        </div>
                    )
                },
                type: 'action',
            },
        ],
        [isTablet, isMobile, props.deletingUsers, props.updatingStatus],
    )

    return (
        <div className={classNames(styles.container, props.className)}>
            <Table
                columns={columns}
                data={results}
                onToggleSort={props.onSortChange}
                showExpand
                removeDefaultSort
                forceSort={props.sort}
                className={styles.desktopTable}
                colWidth={colWidth}
                setColWidth={setColWidth}
            />
            {props.allUsers.length > 0 && (
                <Pagination
                    page={props.page}
                    totalPages={props.totalPages}
                    onPageChange={props.onPageChange}
                />
            )}

            {showDialogEditUserEmail && (
                <DialogEditUserEmail
                    open
                    setOpen={function setOpen() {
                        setShowDialogEditUserEmail(undefined)
                    }}
                    userInfo={showDialogEditUserEmail}
                />
            )}
            {showDialogEditUserHandle && (
                <DialogEditUserHandle
                    open
                    setOpen={function setOpen() {
                        setShowDialogEditUserHandle(undefined)
                    }}
                    userInfo={showDialogEditUserHandle}
                />
            )}
            {showDialogEditUserRoles && (
                <DialogEditUserRoles
                    open
                    setOpen={function setOpen() {
                        setShowDialogEditUserRoles(undefined)
                    }}
                    userInfo={showDialogEditUserRoles}
                />
            )}
            {showDialogEditUserGroups && (
                <DialogEditUserGroups
                    open
                    setOpen={function setOpen() {
                        setShowDialogEditUserGroups(undefined)
                    }}
                    userInfo={showDialogEditUserGroups}
                />
            )}
            {showDialogEditUserSSOLogin && (
                <DialogEditUserSSOLogin
                    open
                    setOpen={function setOpen() {
                        setShowDialogEditSSOLogin(undefined)
                    }}
                    userInfo={showDialogEditUserSSOLogin}
                    providers={ssoLoginProviders}
                />
            )}
            {showDialogEditUserTerms && (
                <DialogEditUserTerms
                    open
                    setOpen={function setOpen() {
                        setShowDialogEditUserTerms(undefined)
                    }}
                    userInfo={showDialogEditUserTerms}
                />
            )}
            {showDialogEditUserStatus && (
                <DialogEditUserStatus
                    open
                    setOpen={function setOpen() {
                        setShowDialogEditUserStatus(undefined)
                    }}
                    userInfo={showDialogEditUserStatus}
                    doUpdateStatus={props.doUpdateStatus}
                    isLoading={updatingStatusBool}
                />
            )}
            {showDialogDeleteUser && (
                <DialogDeleteUser
                    open
                    setOpen={function setOpen() {
                        setShowDialogDeleteUser(undefined)
                    }}
                    userInfo={showDialogDeleteUser}
                    isLoading={props.deletingUsers?.[showDialogDeleteUser.id]}
                    onDelete={function onDelete(ticketUrl: string) {
                        props.doDeleteUser(
                            showDialogDeleteUser,
                            ticketUrl,
                            () => setShowDialogDeleteUser(undefined),
                        )
                    }}
                />
            )}
            {showDialogStatusHistory && (
                <DialogUserStatusHistory
                    open
                    setOpen={function setOpen() {
                        setShowDialogStatusHistory(undefined)
                    }}
                    userInfo={showDialogStatusHistory}
                />
            )}
            {showDialogActivate && (
                <ConfirmModal
                    isLoading={updatingStatusBool}
                    title='Activate Confirmation'
                    onClose={function onClose() {
                        setShowDialogActivate(undefined)
                    }}
                    onConfirm={function onConfirm() {
                        props.doUpdateStatus?.(
                            showDialogActivate.data,
                            'A',
                            '',
                            () => {
                                setShowDialogActivate(undefined)
                            },
                        )
                    }}
                    open
                    allowBodyScroll
                    blockScroll
                >
                    <div>
                        <p className={styles.textConfirmDialog}>
                            {showDialogActivate.message}
                        </p>
                    </div>
                </ConfirmModal>
            )}
        </div>
    )
}

export default UsersTable
