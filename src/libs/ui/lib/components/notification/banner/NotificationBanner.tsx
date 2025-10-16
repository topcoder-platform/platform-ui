import { FC, ReactNode, useCallback } from 'react'

import { InformationCircleIcon } from '@heroicons/react/outline'

import { IconOutline } from '../../svgs'

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
                    <div className={styles.icon}>
                        <InformationCircleIcon className='icon-xl' />
                    </div>
                )}

                {props.content}

                {!props.persistent && (
                    <div className={styles.close} onClick={handleClose}>
                        <IconOutline.XIcon className='icon-lg' />
                    </div>
                )}
            </div>
        </div>
    )
}

export default NotificationBanner
