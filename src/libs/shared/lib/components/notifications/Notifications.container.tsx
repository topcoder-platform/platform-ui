import { FC } from 'react'

import { Notification } from '~/libs/ui'

import { useNotification } from './Notifications.context';

const NotificationsContainer: FC = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <div>
            {notifications.map(n => (
                <Notification key={n.id} notification={n} onClose={removeNotification} />
            ))}
        </div>
    )
}

export default NotificationsContainer
