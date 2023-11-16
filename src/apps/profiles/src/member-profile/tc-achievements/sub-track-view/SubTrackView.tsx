import { FC } from 'react'
import { useParams } from 'react-router-dom'

import { UserProfile } from '~/libs/core'

import { useFetchSubTrackData } from '../../../hooks'
import { StatsDetailsLayout } from '../../../components/tc-achievements/StatsDetailsLayout'
import { getUserProfileRoute, getUserProfileStatsRoute } from '../../../profiles.routes'
import { subTrackLabelToHumanName } from '../../../lib'

import styles from './SubTrackView.module.scss'

interface SubTrackViewProps {
    profile: UserProfile
}

const SubTrackView: FC<SubTrackViewProps> = props => {
    const params = useParams()
    const { trackData, ...subTrackData }: any
        = useFetchSubTrackData(props.profile.handle, params.trackType, params.subTrack)

    return (
        <div className={styles.wrap}>
            <StatsDetailsLayout
                prevTitle={trackData.name}
                title={subTrackLabelToHumanName(subTrackData.name)}
                backAction={getUserProfileStatsRoute(props.profile.handle, trackData.name)}
                closeAction={getUserProfileRoute(props.profile.handle)}
                trackData={subTrackData}
            >
                {subTrackData.name === 'MARATHON_MATCH' || subTrackData.name === 'SRM' ? (
                    'SRM TEst'
                ) : subTrackData.name === 'WEB_DESIGNS' ? (
                    'WEB_DESIGNS test'
                ) : (
                    'Other test'
                )}
                test
            </StatsDetailsLayout>
        </div>
    )
}

export default SubTrackView
