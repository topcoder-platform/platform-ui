import { FC } from 'react'

import { NotificationBanner } from './banner'

interface NotificationProps {
    notification: { message: string; id: string; type: string }
    onClose: (id: string, save?: boolean) => void
}

const Notification: FC<NotificationProps> = props => {

    if (props.notification.type === 'banner') {
        return <NotificationBanner content={props.notification.message} onClose={(save?: boolean) => props.onClose(props.notification.id, save)} />
    }

    return null;
}

export default Notification
