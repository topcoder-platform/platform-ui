import { FC, ReactNode, useCallback } from 'react'

import styles from './NotificationBanner.module.scss'
import { InformationCircleIcon, XCircleIcon } from '@heroicons/react/outline'

interface NotificationBannerProps {
    persistent?: boolean
    content: ReactNode
    icon?: ReactNode
    onClose?: (save?: boolean) => void
}

const NotificationBanner: FC<NotificationBannerProps> = props => {

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
                    <div className={styles.close} onClick={() => props.onClose?.(true)}>
                        <XCircleIcon className='icon-xl' />
                    </div>
                )}
            </div>
        </div>
    )
}

export default NotificationBanner
