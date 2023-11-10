import { FC, useEffect } from 'react'

import { DiceConnectionStatus, useDiceIdConnection } from '~/libs/core'

interface ConnectionHandlerProps {
    onChange: (newStatus: DiceConnectionStatus) => void;
    userId: number;
}

export const ConnectionHandler: FC<ConnectionHandlerProps> = (
    props: ConnectionHandlerProps,
) => {
    const diceConnection: DiceConnectionStatus | undefined = useDiceIdConnection(props.userId)

    useEffect(() => {
        if (diceConnection) {
            props.onChange(diceConnection)
        }
    }, [diceConnection, props])

    return (
        <></>
    )
}
