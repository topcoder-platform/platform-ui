import { FC, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

import { DiceConnectionStatus, useDiceIdConnection } from '~/libs/core'

import styles from './ConnectionHandler.module.scss'

interface ConnectionHandlerProps {
    onComplete: () => void;
    userId: number;
}

export const ConnectionHandler: FC<ConnectionHandlerProps> = (
    props: ConnectionHandlerProps,
) => {
    const diceConnection: DiceConnectionStatus | undefined = useDiceIdConnection(props.userId)

    useEffect(() => {
        if (diceConnection && diceConnection.accepted) {
            props.onComplete()
        }
    }, [diceConnection, props])

    return (
        <>
            <p>
                Scan the following DICE ID QR Code in your DICE ID
                mobile application.
            </p>
            {diceConnection && diceConnection.connection ? (
                <QRCodeSVG
                    value={diceConnection.connection}
                    size={300}
                    className={styles.qrCode}
                    includeMargin
                />
            ) : (
                <p>Loading...</p>
            )}
            <p>
                Once the connection is established, the service will
                offer you a Verifiable Credential.
                <br />
                Press the ACCEPT button in your DICE ID App.
                <br />
                If you DECLINE the invitation, please try again after 5
                minutes.
            </p>
        </>
    )
}
