import { FC, ReactNode, useCallback } from 'react'

import { NotificationBanner } from './banner'

interface NotificationProps {
    notification: {
        icon?: ReactNode;
        id: string;
        message: string;
        type: string;
}
    onClose: (id: string, save?: boolean) => void
}

const Notification: FC<NotificationProps> = props => {
    const handleClose = useCallback((save?: boolean) => {
        props.onClose(props.notification.id, save)
    }, [props.onClose, props.notification.id])

    if (props.notification.type === 'banner') {
        return (
            <NotificationBanner
                icon={props.notification.icon}
                content={props.notification.message}
                onClose={handleClose}
            />
        )
    }

    return <></>
}

export default Notification
