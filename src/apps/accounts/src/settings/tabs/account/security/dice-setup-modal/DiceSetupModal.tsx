/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'react-toastify'
import { KeyedMutator } from 'swr'

import { BaseModal, Button } from '~/libs/ui'
import {
    AppleStore,
    credentialImage,
    diceIdLogoBig,
    diceIdLogoSmall,
    googlePlay,
} from '~/apps/accounts/src/lib'
import { DiceConnectionStatus, UserProfile } from '~/libs/core'

import { ConnectionHandler } from './ConnectionHandler'
import styles from './DiceSetupModal.module.scss'

const GooglePlayLink: string = 'https://play.google.com/store/apps/details?id=com.diwallet1'
const AppleStoreLink: string = 'https://apps.apple.com/us/app/dice-id/id1548148979'
interface DiceSetupModalProps {
    mutateMFAData: KeyedMutator<any>
    onClose: () => void
    profile: UserProfile
}

const DiceSetupModal: FC<DiceSetupModalProps> = (props: DiceSetupModalProps) => {
    const [step, setStep]: [number, Dispatch<SetStateAction<number>>] = useState(1)

    const [diceConnectionUrl, setDiceConnectionUrl] = useState<string>()

    function handleSecondaryButtonClick(): void {
        switch (step) {
            case 2: return setStep(step - 1)
            default: return props.onClose()
        }
    }

    function handlePrimaryButtonClick(): void {
        switch (step) {
            case 1:
                return setStep(step + 1)
            default: return props.onClose()
        }
    }

    function handleDiceConnectionStatusChange(newStatus: DiceConnectionStatus): void {
        if (newStatus.diceEnabled) {
            setStep(4)
            toast.success('Your credentials have been verified and you are all set for'
             + ' MFA using your decentralized identity (DICE ID).')
            props.mutateMFAData()
        } else if (newStatus.accepted) {
            setStep(3)
        } else if (newStatus.connection) {
            setDiceConnectionUrl(newStatus.connection)
            setStep(2)
        }
    }

    return (
        <BaseModal
            open
            onClose={props.onClose}
            title={(
                <div className={styles.titleWrap}>
                    <img
                        src={diceIdLogoSmall}
                        alt='DICE ID Title Logo'
                    />
                    <h3>DICE ID AUTHENTICATOR SETUP</h3>
                </div>
            )}
            size='body'
            classNames={{ modal: styles.diceModal }}
            buttons={(
                <div className={styles.ctaButtons}>
                    <Button
                        secondary
                        label={step === 2 ? 'Back' : 'Cancel'}
                        onClick={handleSecondaryButtonClick}
                    />
                    {
                        (step === 1 || step === 4) && (
                            <Button
                                primary
                                label={step === 4 ? 'Finish' : 'Next'}
                                onClick={handlePrimaryButtonClick}
                            />
                        )
                    }
                </div>
            )}
        >
            {
                step < 4 && (
                    <h3>
                        Step
                        {' '}
                        {step}
                        {' '}
                        of 3
                    </h3>
                )
            }
            {
                step === 1 && (
                    <>
                        <p>First, please download the DICE ID App from the Google Play Store or the iOS App Store.</p>
                        <div className={styles.appSoresWrap}>
                            <div className={styles.appStoreCard}>
                                <a
                                    href={GooglePlayLink}
                                    target='_blank'
                                    rel='noreferrer'
                                >
                                    <img src={googlePlay} alt='Google Play Store' />
                                </a>
                                <QRCodeSVG
                                    value={GooglePlayLink}
                                    size={190}
                                    className={styles.qrCode}
                                    includeMargin
                                />
                            </div>
                            <div className={styles.appStoreCard}>
                                <a
                                    href={AppleStoreLink}
                                    target='_blank'
                                    rel='noreferrer'
                                >
                                    <AppleStore />
                                </a>
                                <QRCodeSVG
                                    value={AppleStoreLink}
                                    size={190}
                                    className={styles.qrCode}
                                    includeMargin
                                />
                            </div>
                        </div>
                        <p>
                            After you have downloaded and installed the mobile app,
                            <span className='body-main-bold'> make sure to complete the configuration process. </span>
                            When ready, click next below.
                        </p>
                    </>
                )
            }
            {
                step === 2 && (
                    <>
                        <ConnectionHandler
                            onChange={handleDiceConnectionStatusChange}
                            userId={props.profile.userId}
                        />
                        <p>
                            Scan the following DICE ID QR Code in your DICE ID
                            mobile application.
                        </p>
                        {diceConnectionUrl ? (
                            <QRCodeSVG
                                value={diceConnectionUrl}
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
            {
                step === 3 && (
                    <>
                        <ConnectionHandler
                            onChange={handleDiceConnectionStatusChange}
                            userId={props.profile.userId}
                        />
                        <p>
                            You will receive the credential offer from Topcoder in the DICE ID wallet home page.
                            <br />
                            Your credentials should get automatically processed in few seconds.
                            <br />
                            If you have disabled the auto-accept feature,
                            please review the credential offer and manually accept it.
                            <br />
                            <br />
                            Example credential offer:
                        </p>
                        <img src={credentialImage} className={styles.credentialImage} alt='Example Credential Offer' />
                    </>
                )
            }
            {
                step === 4 && (
                    <>
                        <h3>Setup completed!</h3>
                        <p>
                            Hello
                            {' '}
                            {props.profile.handle}
                            ,
                            <br />
                            <br />
                            Your credentials have been verified and you are all set
                            for MFA using your decentralized identity (DICE ID).
                        </p>
                        <img src={diceIdLogoBig} className={styles.diceBigLogo} alt='DICE ID Logo' />
                        <p>
                            For more information on DICE ID, please visit
                            {' '}
                            <a
                                href='https://www.diceid.com/'
                                target='_blank'
                                rel='noreferrer'
                            >
                                https://www.diceid.com
                            </a>
                        </p>
                        <p>Please click Finish below.</p>
                    </>
                )
            }
        </BaseModal>
    )
}

export default DiceSetupModal
