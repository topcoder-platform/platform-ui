/**
 * Users table.
 */
import { FC, useMemo, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import moment from 'moment'

import { useWindowSize, WindowSize } from '~/libs/shared'
import {
    Button,
    ConfirmModal,
    IconOutline,
    IconSolid,
    Table,
    TableColumn,
} from '~/libs/ui'

import { CopyButton } from '../CopyButton'
import { DialogEditUserEmail } from '../DialogEditUserEmail'
import { DialogEditUserRoles } from '../DialogEditUserRoles'
import { DialogEditUserGroups } from '../DialogEditUserGroups'
import { DialogEditUserTerms } from '../DialogEditUserTerms'
import { DialogEditUserStatus } from '../DialogEditUserStatus'
import { DialogUserStatusHistory } from '../DialogUserStatusHistory'
import { DropdownMenuButton } from '../common/DropdownMenuButton'
import { useTableFilterLocal, useTableFilterLocalProps } from '../../hooks'
import { TABLE_DATE_FORMAT } from '../../../config/index.config'
import { UserInfo } from '../../models'
import { Pagination } from '../common/Pagination'
import { ReactComponent as RectangleListRegularIcon } from '../../assets/i/rectangle-list-regular-icon.svg'

import styles from './UsersTable.module.scss'

interface Props {
    className?: string
    allUsers: UserInfo[]
    updatingStatus: { [key: string]: boolean }
    doUpdateStatus: (
        userInfo: UserInfo,
        newStatus: string,
        comment: string,
        onSuccess?: () => void,
    ) => void
}

export const UsersTable: FC<Props> = props => {
    const [showDialogEditUserEmail, setShowDialogEditUserEmail] = useState<
        UserInfo | undefined
    >()
    const [showDialogEditUserRoles, setShowDialogEditUserRoles] = useState<
        UserInfo | undefined
    >()
    const [showDialogEditUserGroups, setShowDialogEditUserGroups] = useState<
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
    const { width: screenWidth }: WindowSize = useWindowSize()

    const updatingStatusBool = useMemo(
        () => _.some(props.updatingStatus, value => value === true),
        [props.updatingStatus],
    )

    const isTablet = useMemo(() => screenWidth <= 984, [screenWidth])
    const isMobile = useMemo(() => screenWidth <= 745, [screenWidth])
    const {
        page,
        setPage,
        totalPages,
        results,
        setSort,
    }: useTableFilterLocalProps<UserInfo> = useTableFilterLocal(
        props.allUsers ?? [],
    )
    const columns = useMemo<TableColumn<UserInfo>[]>(
        () => [
            {
                label: 'User ID',
                propertyName: 'id',
                type: 'text',
            },
            {
                className: styles.blockColumnHandle,
                label: 'Handle',
                propertyName: 'handle',
                type: 'text',
            },
            ...(isTablet
                ? [
                      {
                          isExpand: true,
                          label: 'Primary Email',
                          propertyName: 'email',
                          type: 'text',
                      } as TableColumn<UserInfo>,
                ]
                : [
                      {
                          label: 'Primary Email',
                          propertyName: 'email',
                          type: 'text',
                      } as TableColumn<UserInfo>,
                ]),
            {
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
                isExpand: true,
                label: 'Email Status',
                propertyName: 'emailStatusDesc',
                type: 'text',
            },
            {
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
                isExpand: true,
                label: 'Activation Code',
                propertyName: 'activationCode',
                renderer: (data: UserInfo) => (
                    <div className={styles.blockActivationCode}>
                        {!!data.credential.activationCode && (
                            <span className={styles.textActivationCode}>{data.credential.activationCode}</span>
                        )}

                        <div className={styles.blockActivationCodeLink}>
                            <input
                                type='text'
                                value={data.activationLink}
                                readOnly
                                className={styles.blockActivationCodeInput}
                            />

                            <CopyButton
                                text={data.activationLink}
                                className={styles.btnCopy}
                            />
                        </div>
                    </div>
                ),
                type: 'element',
            },
            ...(isMobile
                ? [
                    {
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
                label: 'Action',
                renderer: (data: UserInfo) => {
                    function onSelectOption(item: string): void {
                        if (item === 'Primary Email') {
                            setShowDialogEditUserEmail(data)
                        } else if (item === 'Roles') {
                            setShowDialogEditUserRoles(data)
                        } else if (item === 'Groups') {
                            setShowDialogEditUserGroups(data)
                        } else if (item === 'Terms') {
                            setShowDialogEditUserTerms(data)
                        } else if (item === 'Deactivate') {
                            setShowDialogEditUserStatus(data)
                        } else if (item === 'Activate') {
                            let confirmation = `Are you sure you want to activate user '${data.handle}'?`
                            if (!data.emailActive) {
                                confirmation
                                  += "\nEmail address is also verified by the operation. Please confirm it's valid."
                            }

                            setShowDialogActivate({
                                data,
                                message: confirmation,
                            })
                        }
                    }

                    return (
                        <div className={styles.blockBtns}>
                            {isTablet ? (
                                <DropdownMenuButton
                                    options={[
                                        'Primary Email',
                                        'Roles',
                                        'Groups',
                                        'Terms',
                                        ...(data.active
                                            ? ['Deactivate']
                                            : ['Activate']),
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
                                            'Roles',
                                            'Groups',
                                            'Terms',
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
                                </>
                            )}
                        </div>
                    )
                },
                type: 'action',
            },
        ],
        [isTablet, isMobile],
    )

    return (
        <div className={classNames(styles.container, props.className)}>
            <Table
                columns={columns}
                data={results}
                onToggleSort={setSort}
                showExpand
                removeDefaultSort
            />
            {props.allUsers.length > 0 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
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
