import { Dispatch, FC, useContext, useEffect, useState } from 'react'
import { bind } from 'lodash'
import { toast } from 'react-toastify'

import { profileContext, ProfileContextData, TC_TRACKS, updateMemberProfileAsync, UserProfile } from '~/libs/core'
import { Collapsible, FormToggleSwitch } from '~/libs/ui'
import {
    DataScienceTrackIcon,
    DesignTrackIcon,
    DevelopmentTrackIcon,
    SettingSection,
    triggerSurvey,
} from '~/apps/accounts/src/lib'

import styles from './Tracks.module.scss'

interface TracksProps {
    profile: UserProfile
}

const Tracks: FC<TracksProps> = (props: TracksProps) => {
    const [memberTracks, setMemberTracks]: [TC_TRACKS[], Dispatch<TC_TRACKS[]>]
        = useState<TC_TRACKS[]>(props.profile.tracks || [])

    const memberProfileContext: ProfileContextData = useContext(profileContext)

    useEffect(() => {
        setMemberTracks(props.profile.tracks || [])
    }, [props.profile])

    function handleTracksChange(type: TC_TRACKS): void {
        const hasTrack: boolean = memberTracks.includes(type)
        let updatedTracks: TC_TRACKS[]

        if (hasTrack) {
            // remove track
            updatedTracks = memberTracks.filter((track: TC_TRACKS) => track !== type)
        } else {
            // add track
            updatedTracks = memberTracks.concat(type)
        }

        updateMemberProfileAsync(
            props.profile.handle,
            { tracks: updatedTracks },
        )
            .then(() => {
                setMemberTracks(updatedTracks)
                memberProfileContext.updateProfileContext({
                    ...memberProfileContext,
                    profile: {
                        ...memberProfileContext.profile,
                        tracks: updatedTracks,
                    } as any,
                })
                toast.success('Your profile has been updated.')
                triggerSurvey()
            })
            .catch(() => {
                toast.error('Failed to update your profile.')
            })
    }

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
                        value={!!memberTracks.includes('DESIGN')}
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
                        value={!!memberTracks.includes('DEVELOP')}
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
                        value={!!memberTracks.includes('DATA_SCIENCE')}
                    />
                )}
            />
        </Collapsible>
    )
}

export default Tracks
