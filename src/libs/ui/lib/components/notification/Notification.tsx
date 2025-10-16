import { FC, useCallback } from 'react'

import { NotificationBanner } from './banner'

interface NotificationProps {
    notification: { message: string; id: string; type: string }
    onClose: (id: string, save?: boolean) => void
}

const Notification: FC<NotificationProps> = props => {
    const handleClose = useCallback((save?: boolean) => {
        props.onClose(props.notification.id, save)
    }, [props.onClose])

    if (props.notification.type === 'banner') {
        return (
            <NotificationBanner
                content={props.notification.message}
                onClose={handleClose}
            />
        )
    }

    return <></>
}

export default Notification
