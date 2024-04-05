/* eslint-disable max-len */
import { FC } from 'react'

import { Button } from '~/libs/ui'
import { EnvironmentConfig } from '~/config'

import { ForumIcon, SettingSection } from '../../../lib'

import styles from './PreferencesTab.module.scss'

const PreferencesTab: FC<any> = () => {
    function handleGoToForumPreferences(): void {
        window.open(
            `https://${
                EnvironmentConfig.ENV === 'prod' ? 'discussions' : 'vanilla'
            }.${EnvironmentConfig.TC_DOMAIN}/profile/preferences`,
            '_blank',
        )
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
