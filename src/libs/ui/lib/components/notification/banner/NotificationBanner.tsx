import { FC, ReactNode, useCallback } from 'react'

import { InformationCircleIcon, XCircleIcon } from '@heroicons/react/outline'

import styles from './NotificationBanner.module.scss'

interface NotificationBannerProps {
    persistent?: boolean
    content: ReactNode
    icon?: ReactNode
    onClose?: (save?: boolean) => void
}

const NotificationBanner: FC<NotificationBannerProps> = props => {
    const handleClose = useCallback(() => {
        props.onClose?.(true)
    }, [props.onClose])

    return (
        <div className={styles.wrap}>
            <div className={styles.inner}>
                {props.icon || (
                    <div>
                        <InformationCircleIcon className='icon-xl' />
                    </div>
                )}

                {props.content}

                {!props.persistent && (
                    <div className={styles.close} onClick={handleClose}>
                        <XCircleIcon className='icon-xl' />
                    </div>
                )}
            </div>
        </div>
    )
}

export default NotificationBanner
