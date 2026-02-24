/**
 * Dialog with SendGrid emails sent to a member in the last 30 days.
 */
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import moment from 'moment'

import {
    BaseModal,
    Button,
    IconOutline,
    LoadingSpinner,
    Table,
    TableColumn,
} from '~/libs/ui'

import {
    MSG_NO_RECORD_FOUND,
    TABLE_DATE_FORMAT,
} from '../../../config/index.config'
import { MemberSendgridEmail, UserInfo } from '../../models'
import { fetchMemberSendgridEmails } from '../../services'
import { handleError } from '../../utils'

import styles from './DialogUserEmails.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
    userInfo: UserInfo
}

export const DialogUserEmails: FC<Props> = (props: Props) => {
    const [isLoading, setIsLoading] = useState(false)
    const [emails, setEmails] = useState<MemberSendgridEmail[]>([])

    const handleClose = useCallback(() => {
        props.setOpen(false)
    }, [props.setOpen])

    useEffect(() => {
        if (!props.open) {
            return undefined
        }

        let active = true
        setIsLoading(true)
        fetchMemberSendgridEmails(props.userInfo.handle)
            .then(result => {
                if (active) {
                    setEmails(result)
                }
            })
            .catch(error => {
                if (active) {
                    setEmails([])
                }

                handleError(error)
            })
            .finally(() => {
                if (active) {
                    setIsLoading(false)
                }
            })

        return () => {
            active = false
        }
    }, [props.open, props.userInfo.handle])

    const columns = useMemo<TableColumn<MemberSendgridEmail>[]>(
        () => [
            {
                className: styles.tableCell,
                columnId: 'subject',
                label: 'Subject',
                propertyName: 'subject',
                type: 'text',
            },
            {
                className: styles.tableCellNoWrap,
                columnId: 'toEmail',
                label: 'To Email',
                propertyName: 'toEmail',
                type: 'text',
            },
            {
                className: styles.statusCell,
                columnId: 'status',
                label: 'Status',
                propertyName: 'status',
                renderer: (data: MemberSendgridEmail) => {
                    const status = data.status || '-'
                    const isDelivered = status.toLowerCase() === 'delivered'

                    return (
                        <span
                            className={classNames(
                                styles.emailStatus,
                                isDelivered
                                    ? styles.emailStatusDelivered
                                    : styles.emailStatusFailed,
                            )}
                            title={status}
                            aria-label={status}
                            role='img'
                        >
                            {isDelivered
                                ? <IconOutline.CheckCircleIcon aria-hidden />
                                : <IconOutline.XCircleIcon aria-hidden />}
                        </span>
                    )
                },
                type: 'element',
            },
            {
                className: styles.tableCellNoWrap,
                columnId: 'timestamp',
                label: 'Timestamp',
                propertyName: 'timestamp',
                renderer: (data: MemberSendgridEmail) => {
                    if (data.timestamp === '-') {
                        return <div>-</div>
                    }

                    const timestamp = moment(data.timestamp)
                    const timestampDisplay = timestamp.isValid()
                        ? timestamp
                            .local()
                            .format(TABLE_DATE_FORMAT)
                        : data.timestamp

                    return <div>{timestampDisplay}</div>
                },
                type: 'element',
            },
        ],
        [],
    )

    return (
        <BaseModal
            allowBodyScroll
            blockScroll
            title={`Emails of ${props.userInfo.handle}`}
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
                        {emails.length === 0 ? (
                            <p className={styles.noRecordFound}>
                                {MSG_NO_RECORD_FOUND}
                            </p>
                        ) : (
                            <Table
                                columns={columns}
                                data={emails}
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

export default DialogUserEmails
