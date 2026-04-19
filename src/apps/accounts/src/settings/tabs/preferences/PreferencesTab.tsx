/* eslint-disable max-len */
import { FC, FocusEvent } from 'react'
import { toast } from 'react-toastify'

import { EnvironmentConfig } from '~/config'
import {
    updateMemberEmailPreferencesAsync,
    useMemberEmailPreferences,
    UserProfile,
} from '~/libs/core'
import { Button, FormToggleSwitch, LoadingSpinner } from '~/libs/ui'

import { EmailIcon, ForumIcon, SettingSection } from '../../../lib'

import { newsletters, programs, subscribeLink, unsubscribeLink } from './preferences.config'
import styles from './PreferencesTab.module.scss'

interface PreferencesTabProps {
    profile: UserProfile
}

const PreferencesTab: FC<PreferencesTabProps> = (props: PreferencesTabProps) => {
    const emailPreferencesApi: ReturnType<typeof useMemberEmailPreferences>
        = useMemberEmailPreferences(props.profile.email)
    const emailPreferences = emailPreferencesApi.data
    const mutateEmailPreferencesData = emailPreferencesApi.mutate
    const mailChimpFormAction: string = emailPreferences?.status === 'subscribed'
        ? unsubscribeLink
        : subscribeLink

    function handleGoToForumPreferences(): void {
        window.open(
            `https://${
                EnvironmentConfig.ENV === 'prod' ? 'discussions' : 'vanilla'
            }.${EnvironmentConfig.TC_DOMAIN}/profile/preferences`,
            '_blank',
        )
    }

    /**
     * Redirects the member to the hosted subscription flow for account emails.
     */
    function handleSubscriptionStatusChange(): void {
        window.open(
            emailPreferences?.status === 'subscribed' ? unsubscribeLink : subscribeLink,
            '_self',
        )
    }

    /**
     * Updates a single email preference toggle and refreshes the cached preferences.
     */
    function handleUserEmailPreferencesChange(event: FocusEvent<HTMLInputElement>): void {
        const id: string = event.currentTarget.name

        updateMemberEmailPreferencesAsync(props.profile.email, {
            interests: {
                [id]: !emailPreferences?.interests[id],
            },
        })
            .then(() => {
                toast.success('Your email preferences were updated.')
                mutateEmailPreferencesData()
            })
            .catch(() => {
                toast.error('Something went wrong. Please try again later.')
            })
    }

    return (
        <div className={styles.container}>
            <h3>PLATFORM PREFERENCES</h3>

            <div className={styles.content}>
                {emailPreferences ? (
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
                            infoText={
                                emailPreferences.status === 'subscribed'
                                    ? 'If this was a mistake or if you would like to unsubscribe, please click the “Unsubscribe” button.'
                                    : 'If you would like to subscribe to receive Topcoder emails, please click the “Subscribe” button.'
                            }
                            actionElement={(
                                <div className={styles.subAction}>
                                    <form
                                        action={mailChimpFormAction}
                                        method='post'
                                        id='mc-embedded-subscribe-form'
                                        name='mc-embedded-subscribe-form'
                                        noValidate
                                    >
                                        <input
                                            type='email'
                                            value={props.profile.email}
                                            readOnly
                                            name='EMAIL'
                                            id='mce-EMAIL'
                                        />
                                        <input
                                            type='checkbox'
                                            id='gdpr_11101'
                                            name='gdpr[11101]'
                                            value='Y'
                                            readOnly
                                        />
                                        <input
                                            type='text'
                                            name='b_65bd5a1857b73643aad556093_28bfd3c062'
                                            value=''
                                            readOnly
                                        />
                                        <Button
                                            label={
                                                emailPreferences.status === 'subscribed'
                                                    ? 'Unsubscribe'
                                                    : 'Subscribe'
                                            }
                                            secondary
                                            size='lg'
                                            onClick={handleSubscriptionStatusChange}
                                            type='submit'
                                        />
                                    </form>
                                </div>
                            )}
                        />

                        {emailPreferences.status === 'subscribed' && (
                            <>
                                {newsletters.concat(programs)
                                    .map(preference => (
                                        <SettingSection
                                            key={preference.id}
                                            title={preference.name}
                                            infoText={preference.desc}
                                            actionElement={(
                                                <FormToggleSwitch
                                                    name={preference.id}
                                                    onChange={handleUserEmailPreferencesChange}
                                                    value={Boolean(emailPreferences.interests[preference.id])}
                                                />
                                            )}
                                        />
                                    ))}
                            </>
                        )}
                    </>
                ) : (
                    <LoadingSpinner hide={false} overlay />
                )}

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
