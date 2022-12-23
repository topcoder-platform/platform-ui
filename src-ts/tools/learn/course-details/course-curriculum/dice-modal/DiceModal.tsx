import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'

import { EnvironmentConfig } from '../../../../../config'
import { BaseModal, Button } from '../../../../../lib'

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
            title='DICE Multifactor Authentication Required'
        >
            <div className={styles.diceModal}>

                <p>
                    Wipro requires employees to enable multifactor Authentication
                    with DICE in order to take Topcoder Academy courses.
                </p>
                <p>
                    Please go to Account Settings to configure your account.
                </p>
                <p className={styles.buttonContainer}>
                    <Button
                        buttonStyle='primary'
                        label='Account Settings'
                        onClick={props.onClose}
                        target='_blank'
                        url={EnvironmentConfig.TOPCODER_URLS.ACCOUNT_SETTINGS}
                    />
                </p>
            </div>

        </BaseModal>
    )
}

export default DiceModal
