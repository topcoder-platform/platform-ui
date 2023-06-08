import { Dispatch, FC, useState } from 'react'
import { bind } from 'lodash'

import { TC_TRACKS, UserProfile } from '~/libs/core'
import { Collapsible, FormToggleSwitch } from '~/libs/ui'
import { DataScienceTrackIcon, DesignTrackIcon, DevelopmentTrackIcon, SettingSection } from '~/apps/accounts/src/lib'

import styles from './Tracks.module.scss'

interface TracksProps {
    profile: UserProfile
}

const Tracks: FC<TracksProps> = (props: TracksProps) => {
    const [devTrack, setDevTrack]: [boolean, Dispatch<boolean>]
        = useState<boolean>(!!props.profile.tracks?.includes('DEVELOP'))

    const [designTrack, setDesignTrack]: [boolean, Dispatch<boolean>]
        = useState<boolean>(!!props.profile.tracks?.includes('DESIGN'))

    const [dsTrack, setDSTrack]: [boolean, Dispatch<boolean>]
        = useState<boolean>(!!props.profile.tracks?.includes('DATA_SCIENCE'))

    function handleTracksChange(type: TC_TRACKS): void {
        
    }

    console.log('devTrack', props)

    return (
        <Collapsible
            header={<h3>Tracks</h3>}
            containerClass={styles.container}
            contentClass={styles.content}
        >
            <p>
                Topcoder&apos;s three categories of challenges...
                please pick at least one based on your skills and interests.
            </p>

            <SettingSection
                leftElement={(
                    <DesignTrackIcon />
                )}
                title='Design'
                infoText='Website, mobile, and product design; UI and UX'
                actionElement={(
                    <FormToggleSwitch
                        name='designTrack'
                        onChange={bind(handleTracksChange, this, 'DESIGN')}
                        value={designTrack}
                    />
                )}
            />

            <SettingSection
                leftElement={(
                    <DevelopmentTrackIcon />
                )}
                title='Development'
                infoText='Software architecture, component assembly, application development, and bug hunting'
                actionElement={(
                    <FormToggleSwitch
                        name='devTrack'
                        onChange={bind(handleTracksChange, this, 'DEVELOP')}
                        value={devTrack}
                    />
                )}
            />

            <SettingSection
                leftElement={(
                    <DataScienceTrackIcon />
                )}
                title='Data Science'
                infoText='Algorithms and data structures, statistical analysis'
                actionElement={(
                    <FormToggleSwitch
                        name='dsTrack'
                        onChange={bind(handleTracksChange, this, 'DATA_SCIENCE')}
                        value={dsTrack}
                    />
                )}
            />
        </Collapsible>
    )
}

export default Tracks
