import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'

import { EnvironmentConfig } from '~/config'
import { BaseModal, Button } from '~/libs/ui'

import styles from './DiceModal.module.scss'

interface DiceModalProps {
    isOpen: boolean
    onClose: () => void
}

const DiceModal: FC<DiceModalProps> = (props: DiceModalProps) => {

    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    useEffect(() => {
        setIsOpen(props.isOpen)
    }, [props.isOpen])

    return (
        <BaseModal
            onClose={props.onClose}
            open={isOpen}
            size='md'
            title='DICE ID Multifactor Authentication Required'
        >
            <div className={styles.diceModal}>

                <p>
                    Wipro requires employees to enable Multifactor Authentication
                    with DICE ID in order to take Topcoder Academy courses.
                </p>
                <p>
                    Please go to Account Settings to configure your account.
                </p>
                <p className={styles.buttonContainer}>
                    <a href={EnvironmentConfig.URLS.ACCOUNT_SETTINGS} target='_blank' rel='noreferrer'>
                        <Button
                            primary
                            label='Account Settings'
                            size='lg'
                        />
                    </a>
                </p>
                <p>
                    When you have completed configuring your account,
                    click below to refresh your settings.
                </p>
                <p className={styles.buttonContainer}>
                    <a href={window.location.href}>
                        <Button
                            secondary
                            label='Refresh Settings'
                            onClick={props.onClose}
                            size='lg'
                        />
                    </a>
                </p>
            </div>

        </BaseModal>
    )
}

export default DiceModal
