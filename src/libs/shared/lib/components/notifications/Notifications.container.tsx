import { FC } from 'react'

import { Notification } from '~/libs/ui'

import { NotificationContextType, useNotification } from './Notifications.context'
import styles from './NotificationsContainer.module.scss'

const NotificationsContainer: FC = () => {
    const { notifications, removeNotification }: NotificationContextType = useNotification()

    return (
        <div className={styles.wrap}>
            {notifications.map(n => (
                <Notification key={n.id} notification={n} onClose={removeNotification} />
            ))}
        </div>
    )
}

export default NotificationsContainer
