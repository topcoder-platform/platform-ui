/**
 * Dialog status history of user.
 */
import { FC, useMemo } from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import moment from 'moment'

import {
    BaseModal,
    Button,
    LoadingSpinner,
    Table,
    TableColumn,
} from '~/libs/ui'

import {
    MSG_NO_RECORD_FOUND,
    TABLE_DATE_FORMAT,
} from '../../../config/index.config'
import {
    useEventCallback,
    useManageUserAchievements,
    useManageUserAchievementsProps,
} from '../../hooks'
import { UserInfo, UserStatusHistory } from '../../models'

import styles from './DialogUserStatusHistory.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
    userInfo: UserInfo
}

export const DialogUserStatusHistory: FC<Props> = (props: Props) => {
    const handleClose = useEventCallback(() => props.setOpen(false))
    const { isLoading, userAchievements }: useManageUserAchievementsProps = useManageUserAchievements(
        props.userInfo,
    )
    const columns = useMemo<TableColumn<UserStatusHistory>[]>(
        () => [
            {
                className: styles.tableCellNoWrap,
                label: 'Date',
                propertyName: 'createdAt',
                renderer: (data: UserStatusHistory) => (
                    <div>
                        {moment(data.createdAt)
                            .local()
                            .format(TABLE_DATE_FORMAT)}
                    </div>
                ),
                type: 'element',
            },
            {
                className: styles.tableCell,
                label: 'Comment',
                propertyName: 'description',
                type: 'text',
            },
        ],
        [],
    )

    return (
        <BaseModal
            allowBodyScroll
            blockScroll
            title={`Status history of ${props.userInfo.handle}`}
            onClose={handleClose}
            open={props.open}
            classNames={{
                modal: classNames(styles.modal),
            }}
        >
            <div className={classNames(styles.container, props.className)}>
                {isLoading ? (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                ) : (
                    <>
                        {userAchievements.length === 0 ? (
                            <p className={styles.noRecordFound}>
                                {MSG_NO_RECORD_FOUND}
                            </p>
                        ) : (
                            <Table
                                columns={columns}
                                data={userAchievements}
                                disableSorting
                                onToggleSort={_.noop}
                                className={styles.desktopTable}
                            />
                        )}
                    </>
                )}
                <div className={styles.actionButtons}>
                    <Button secondary size='lg' onClick={handleClose}>
                        Close
                    </Button>
                </div>
            </div>
        </BaseModal>
    )
}

export default DialogUserStatusHistory
