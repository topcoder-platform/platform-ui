import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { get, isUndefined, lowerCase } from 'lodash'
import { toast } from 'react-toastify'
import { KeyedMutator } from 'swr'

import { BaseModal, Button } from '~/libs/ui'
import {
    AppleStore,
    diceIdLogoBig,
    diceIdLogoSmall,
    googlePlay,
    UnSuccessfullDiceVerificationIcon,
} from '~/apps/accounts/src/lib'
import { DiceConnectionStatus, updateMemberMFAStatusAsync, useDiceIdConnection, UserProfile } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import { VerificationListener } from './VerificationListener'
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

    const [diceConnectionId, setDiceConnectionId]: [
        number | undefined,
        Dispatch<SetStateAction<number | undefined>>
    ] = useState()

    const diceConnection: DiceConnectionStatus | undefined = useDiceIdConnection(props.profile.userId, diceConnectionId)

    const [isVerificationProcessing, setIsVerificationProcessing]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState(false)

    useEffect(() => {
        if (diceConnection && !diceConnectionId) {
            setDiceConnectionId(diceConnection.id)
        }
    }, [
        diceConnection,
        diceConnectionId,
    ])

    function handleSecondaryButtonClick(): void {
        switch (step) {
            case 2: return setStep(step - 1)
            default: return props.onClose()
        }
    }

    function handlePrimaryButtonClick(): void {
        switch (step) {
            case 1:
            case 2:
                return setStep(step + 1)
            default: return props.onClose()
        }
    }

    function verificationCallback(data: any): void {
        if (data.success) {
            const userEmail: string = get(data, 'user.profile.Email')
            if (!isUndefined(userEmail) && lowerCase(userEmail) === lowerCase(props.profile.email)) {
                updateMemberMFAStatusAsync(props.profile.userId, {
                    param: {
                        diceEnabled: true,
                    },
                })
                    .then(() => {
                        props.mutateMFAData()
                        setStep(4)
                        // eslint-disable-next-line max-len
                        toast.success('Your credentials have been verified and you are all set for MFA using your decentralized identity (DICE ID).')
                    })
                    .catch(() => {
                        toast.error('Something went wrong. Please try again later.')
                    })
            } else {
                setStep(5)
            }
        } else {
            setStep(5)
        }
    }

    function onStartProcessing(): void {
        setIsVerificationProcessing(true)
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
                        step !== 3 && (
                            <Button
                                primary
                                label={(step === 4 || step === 5) ? 'Finish' : 'Next'}
                                onClick={handlePrimaryButtonClick}
                                disabled={step === 2 && !diceConnection?.accepted}
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
                        <p>Scan the following DICE ID QR Code in your DICE ID mobile application.</p>
                        {
                            diceConnection ? (
                                <QRCodeSVG
                                    value={diceConnection.connection as string}
                                    size={300}
                                    className={styles.qrCode}
                                    includeMargin
                                />
                            ) : (
                                <p>Loading...</p>
                            )
                        }
                        <p>
                            Once the connection is established, the service will offer you
                            a Verifiable Credential.
                            <br />
                            Press the ACCEPT button in your DICE ID App.
                            <br />
                            If you DECLINE the invitation, please try again after 5 minutes.
                        </p>
                    </>
                )
            }
            {
                step === 3 && (
                    <>
                        <p>
                            Scan the following DICE ID QR Code in your DICE ID
                            mobile application to confirm your credential.
                        </p>
                        <iframe
                            src={`${EnvironmentConfig.DICE_VERIFY_URL}/dice-verifier.html`}
                            title='dice verifier'
                            width='100%'
                            height='350px'
                        />
                        {isVerificationProcessing && (
                            <div className='body-small'>
                                Powered by DICE ID
                            </div>
                        )}
                        <VerificationListener
                            event='message'
                            callback={verificationCallback}
                            origin={EnvironmentConfig.DICE_VERIFY_URL}
                            type='DICE_VERIFICATION'
                            onProcessing={onStartProcessing}
                            startType='DICE_VERIFICATION_START'
                        />
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
                        <p>Please click Finish bellow.</p>
                    </>
                )
            }
            {
                step === 5 && (
                    <>
                        <div className={styles.errorWrap}>
                            <UnSuccessfullDiceVerificationIcon />
                            <h3 className={styles.errorText}>Unsuccessful Verification!</h3>
                        </div>
                        <p>
                            Hello
                            {' '}
                            {props.profile.handle}
                            ,
                            <br />
                            <br />
                            Your credentials could not be verified,
                            you won&apos;t be able to connect to MFA using your decentralized identity (DICE ID).
                        </p>
                        <img src={diceIdLogoBig} className={styles.diceBigLogo} alt='DICE ID Logo' />
                        <p>
                            Please try again your process after few minutes.
                            <br />
                            <br />
                        </p>
                        <p>Please click Finish bellow.</p>
                    </>
                )
            }
        </BaseModal>
    )
}

export default DiceSetupModal
