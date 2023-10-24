/* eslint-disable max-len */
import { FC } from 'react'
import { bind } from 'lodash'
import { toast } from 'react-toastify'

import { MemberEmailPreferenceAPI, updateMemberEmailPreferencesAsync, useMemberEmailPreferences, UserProfile } from '~/libs/core'
import { Button, FormToggleSwitch, LoadingSpinner } from '~/libs/ui'
import { EnvironmentConfig } from '~/config'

import { EmailIcon, ForumIcon, SettingSection, triggerSurvey } from '../../../lib'

import { newsletters, programs, subscribeLink, unsubscribeLink } from './preferences.config'
import styles from './PreferencesTab.module.scss'

interface PreferencesTabProps {
    profile: UserProfile
}

const PreferencesTab: FC<PreferencesTabProps> = (props: PreferencesTabProps) => {
    const { data: emailPreferences, mutate: mutateEmailPreferencesData }: MemberEmailPreferenceAPI
        = useMemberEmailPreferences(props.profile.email)

    const mailChimpFormAction: string = emailPreferences?.status === 'subscribed' ? unsubscribeLink : subscribeLink

    function handleGoToForumPreferences(): void {
        window.open(`https://${EnvironmentConfig.ENV === 'prod' ? 'discussions' : 'vanilla'}.${EnvironmentConfig.TC_DOMAIN}/profile/preferences`, '_blank')
    }

    function handleSubscribtionStatusChange(): void {
        if (emailPreferences?.status === 'subscribed') {
            window.open(unsubscribeLink, '_self')
        } else {
            window.open(subscribeLink, '_self')
        }
    }

    function handleUserEmailPreferencesChange(id: string): void {
        updateMemberEmailPreferencesAsync(props.profile.email, {
            interests: {
                [id]: !emailPreferences?.interests[id],
            },
        })
            .then(() => {
                toast.success('Your email preferences ware updated.')
                mutateEmailPreferencesData()
                triggerSurvey()
            })
            .catch(() => {
                toast.error('Something went wrong. Please try again later.')
            })
    }

    return (
        <div className={styles.container}>
            <h3>PLATFORM PREFERENCES</h3>

            <div className={styles.content}>
                {
                    !!emailPreferences ? (
                        <>
                            <SettingSection
                                leftElement={(
                                    <div className={styles.imageWrap}>
                                        <EmailIcon />
                                    </div>
                                )}
                                title={
                                    emailPreferences.status === 'subscribed'
                                        ? 'You Are Currently Subscribed To Receive Topcoder Emails'
                                        : 'You Are Not Subscribed To Receive Topcoder Emails'
                                }
                                // eslint-disable-next-line max-len
                                infoText={
                                    emailPreferences.status === 'subscribed'
                                        ? 'If this was a mistake or if you would like to unsubscribe, please click the “Unsubscribe” button.'
                                        : 'If you would like to subscribe to receive Topcoder emails, please click the “Subscribe” button.'
                                }
                                actionElement={(
                                    <div className={styles.subAction}>
                                        <form action={mailChimpFormAction} method='post' id='mc-embedded-subscribe-form' name='mc-embedded-subscribe-form' noValidate>
                                            <input type='email' value={props.profile.email} readOnly name='EMAIL' id='mce-EMAIL' />
                                            <input type='checkbox' id='gdpr_11101' name='gdpr[11101]' value='Y' readOnly />
                                            <input type='text' name='b_65bd5a1857b73643aad556093_28bfd3c062' value='' readOnly />
                                            <Button
                                                label={emailPreferences.status === 'subscribed' ? 'Unsubscribe' : 'Subscribe'}
                                                secondary
                                                size='lg'
                                                onClick={handleSubscribtionStatusChange}
                                                type='submit'
                                            />
                                        </form>
                                    </div>
                                )}
                            />

                            {
                                emailPreferences.status === 'subscribed' && (
                                    <>
                                        {
                                            newsletters.concat(programs)
                                                .map(preference => (
                                                    <SettingSection
                                                        key={preference.id}
                                                        title={preference.name}
                                                        infoText={preference.desc}
                                                        actionElement={(
                                                            <FormToggleSwitch
                                                                name={preference.id}
                                                                onChange={bind(handleUserEmailPreferencesChange, this, preference.id)}
                                                                value={emailPreferences.interests[preference.id]}
                                                            />
                                                        )}
                                                    />
                                                ))
                                        }
                                    </>
                                )
                            }
                        </>
                    ) : (
                        <LoadingSpinner hide={!!emailPreferences} overlay />
                    )
                }

                <SettingSection
                    leftElement={(
                        <div className={styles.imageWrap}>
                            <ForumIcon />
                        </div>
                    )}
                    title='Forum'
                    infoText='To setup your forum preferences, please click the “Go To Forum” button.'
                    actionElement={(
                        <Button
                            label='Go To Forum'
                            secondary
                            size='lg'
                            className={styles.sectionButton}
                            onClick={handleGoToForumPreferences}
                        />
                    )}
                />

            </div>
        </div>
    )
}

export default PreferencesTab
