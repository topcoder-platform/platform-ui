import { Dispatch, FC, SetStateAction, useState } from 'react'

import { Button, Collapsible, FormToggleSwitch } from '~/libs/ui'
import { diceIdLogo, MFAImage, SettingSection } from '~/apps/accounts/src/lib'

import { DiceSetupModal } from './dice-setup-modal'
import styles from './Security.module.scss'

const Security: FC<{}> = () => {
    const [mfaStatus, setMFAStatus]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)
    const [setupDiceModalOpen, setSetupDiceModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    function handleUserMFAChange(event: any): void {
        console.log('handleUserMFAChange', event)
        setMFAStatus(!mfaStatus)
    }

    function handleDiceModalStatus(): void {
        setSetupDiceModalOpen(!setupDiceModalOpen)
    }

    return (
        <Collapsible
            header={<h3>Security</h3>}
            containerClass={styles.container}
            contentClass={styles.content}
        >
            <SettingSection
                leftElement={(
                    <div className={styles.imageWrap}>
                        <MFAImage />
                    </div>
                )}
                title='Multi Factor Authentication (MFA) Status'
                // eslint-disable-next-line max-len
                infoText='Status of MFA for your Topcoder account. If enabled, MFA will be enforced during the Topcoder login process.'
                actionElement={(
                    <FormToggleSwitch
                        name='mfaStatus'
                        onChange={handleUserMFAChange}
                        value={mfaStatus}
                    />
                )}
            />

            <SettingSection
                leftElement={(
                    <div className={styles.imageWrap}>
                        <img src={diceIdLogo} alt='DiceID logo' />
                    </div>
                )}
                title='DICE ID Authenticator App'
                infoText='DICE ID authentication application.'
                actionElement={(
                    <Button
                        label='Setup DICE ID Authentication'
                        secondary
                        size='lg'
                        className={styles.diceIdButton}
                        onClick={handleDiceModalStatus}
                    />
                )}
            />

            {setupDiceModalOpen && (
                <DiceSetupModal
                    onClose={handleDiceModalStatus}
                />
            )}
        </Collapsible>
    )
}

export default Security
