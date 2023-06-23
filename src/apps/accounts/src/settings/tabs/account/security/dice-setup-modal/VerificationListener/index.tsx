import { FC, useCallback, useEffect } from 'react'

interface VerificationListenerProps {
    event: string
    callback: (data: object) => void
    origin: string
    type: string
    onProcessing: () => void
    startType: string
}

export const VerificationListener: FC<VerificationListenerProps> = (props: VerificationListenerProps) => {
    const messageHandler: (e: any) => void = useCallback(e => {
        if (e.origin === props.origin && e.data && e.data.type) {
            if (e.data.type === props.startType) {
                props.onProcessing()
            } else if (e.data.type === props.type) {
                props.callback(e.data)
            }
        }
    }, [props])

    useEffect(() => {
        window.addEventListener(props.event, messageHandler)
        return () => window.removeEventListener(props.event, messageHandler)
    }, [props.event, messageHandler])

    return <></>
}
