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
