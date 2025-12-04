import { ChangeEvent, FC, useCallback, useEffect, useState } from 'react'
import classNames from 'classnames'

import { BaseModal, Button, InputText } from '~/libs/ui'

import { UserInfo } from '../../models'

import styles from './DialogDeleteUser.module.scss'

interface Props {
    className?: string
    open: boolean
    setOpen: (isOpen: boolean) => void
    userInfo: UserInfo
    isLoading?: boolean
    onDelete: (ticketUrl: string) => void
}

export const DialogDeleteUser: FC<Props> = (props: Props) => {
    const [ticketUrl, setTicketUrl] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        if (props.open) {
            setTicketUrl('')
            setError('')
        }
    }, [props.open])

    const handleClose = useCallback(() => {
        if (!props.isLoading) {
            props.setOpen(false)
        }
    }, [props.isLoading, props.setOpen])

    const handleConfirm = useCallback(() => {
        if (!ticketUrl.trim()) {
            setError('Delete ticket URL is required')
            return
        }

        setError('')
        props.onDelete(ticketUrl.trim())
    }, [props, ticketUrl])

    const handleTicketUrlChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            if (error) {
                setError('')
            }

            setTicketUrl(event.target.value)
        },
        [error],
    )

    const description
        = `Are you sure you want to DELETE user ${props.userInfo.handle} with email address ${props.userInfo.email}. `
        + 'If you are sure, please enter the associated delete request ticket URL below'

    return (
        <BaseModal
            allowBodyScroll
            blockScroll
            title={`Delete ${props.userInfo.handle}`}
            onClose={handleClose}
            open={props.open}
            focusTrapped={false}
        >
            <div className={classNames(styles.container, props.className)}>
                <p className={styles.description}>{description}</p>
                <InputText
                    name='ticketUrl'
                    label='Delete request ticket URL'
                    placeholder='https://'
                    value={ticketUrl}
                    error={error}
                    onChange={handleTicketUrlChange}
                    disabled={props.isLoading}
                />

                <div className={styles.actions}>
                    <Button
                        secondary
                        size='lg'
                        onClick={handleClose}
                        disabled={props.isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        primary
                        variant='danger'
                        size='lg'
                        onClick={handleConfirm}
                        disabled={props.isLoading}
                    >
                        DELETE
                    </Button>
                </div>
            </div>
        </BaseModal>
    )
}

export default DialogDeleteUser
