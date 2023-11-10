import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { KeyedMutator } from 'swr'

import { Button, Collapsible, FormToggleSwitch } from '~/libs/ui'
import { diceIdLogo, MFAImage, SettingSection, triggerSurvey } from '~/apps/accounts/src/lib'
import { MemberMFAStatus, updateMemberMFAStatusAsync, useMemberMFAStatus, UserProfile } from '~/libs/core'

import { DiceSetupModal } from './dice-setup-modal'
import styles from './Security.module.scss'

interface SecurityProps {
    profile: UserProfile
}

const Security: FC<SecurityProps> = (props: SecurityProps) => {
    const [setupDiceModalOpen, setSetupDiceModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    const { data: mfaStatusData, mutate: mutateMFAData }: {
        data: MemberMFAStatus | undefined
        mutate: KeyedMutator<any>,
    } = useMemberMFAStatus(props.profile.userId)

    const [mfaEnabled, setMFAEnabled]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)
    const [diceEnabled, setDiceEnabled]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    useEffect(() => {
        if (mfaStatusData) {
            setMFAEnabled(mfaStatusData.mfaEnabled)
            setDiceEnabled(mfaStatusData.diceEnabled)
        }
    }, [mfaStatusData])

    function handleUserMFAChange(): void {
        updateMemberMFAStatusAsync(props.profile.userId, {
            param: {
                mfaEnabled: !mfaEnabled,
            },
        })
            .then(response => {
                setMFAEnabled(response.result.content.mfaEnabled)
                setDiceEnabled(response.result.content.diceEnabled)
                toast.success('Your Multi Factor Authentication (MFA) status was updated.')
                triggerSurvey()
            })
            .catch(() => {
                toast.error('Something went wrong. Please try again later.')
            })
    }

    function handleUserDiceChange(): void {
        if (!diceEnabled) {
            return
        }

        updateMemberMFAStatusAsync(props.profile.userId, {
            param: {
                diceEnabled: !diceEnabled,
            },
        })
            .then(response => {
                setMFAEnabled(response.result.content.mfaEnabled)
                setDiceEnabled(response.result.content.diceEnabled)
                toast.success('Your DICE credential was disabled.')
                triggerSurvey()
            })
            .catch(() => {
                toast.error('Something went wrong. Please try again later.')
            })
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
                        value={mfaEnabled}
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
                    <div className={styles.diceBtnWrap}>
                        {
                            diceEnabled ? (
                                <FormToggleSwitch
                                    name='diceEnabled'
                                    onChange={handleUserDiceChange}
                                    value={mfaStatusData?.diceEnabled as boolean}
                                />
                            ) : (
                                <Button
                                    label='Setup DICE ID Authentication'
                                    secondary
                                    size='lg'
                                    className={styles.diceIdButton}
                                    onClick={handleDiceModalStatus}
                                    disabled={!mfaEnabled}
                                />
                            )
                        }
                    </div>
                )}
            />

            {setupDiceModalOpen && (
                <DiceSetupModal
                    mutateMFAData={mutateMFAData}
                    onClose={handleDiceModalStatus}
                    profile={props.profile}
                />
            )}
        </Collapsible>
    )
}

export default Security
