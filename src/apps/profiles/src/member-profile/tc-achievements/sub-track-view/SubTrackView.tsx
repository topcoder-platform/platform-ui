import { FC, ReactElement } from 'react'
import { useParams } from 'react-router-dom'
import { isEmpty } from 'lodash'

import { UserProfile } from '~/libs/core'

import { useFetchSubTrackData } from '../../../hooks'
import { StatsDetailsLayout } from '../../../components/tc-achievements/StatsDetailsLayout'
import { DevelopTrackView } from '../../../components/tc-achievements/DevelopTrackView'
import { SRMView } from '../../../components/tc-achievements/SRMView'
import { getUserProfileRoute, getUserProfileStatsRoute } from '../../../profiles.routes'
import { subTrackLabelToHumanName } from '../../../lib'

import styles from './SubTrackView.module.scss'

interface SubTrackViewProps {
    profile: UserProfile
    renderDefault: () => ReactElement
}

const SubTrackView: FC<SubTrackViewProps> = props => {
    const params = useParams()
    const { trackData, ...subTrackData }: any
        = useFetchSubTrackData(props.profile.handle, params.trackType, params.subTrack)

    return (!trackData || isEmpty(subTrackData)) ? props.renderDefault() : (
        <div className={styles.wrap}>
            <StatsDetailsLayout
                prevTitle={trackData.name}
                title={subTrackLabelToHumanName(subTrackData.name)}
                backAction={getUserProfileStatsRoute(props.profile.handle, trackData.name)}
                closeAction={getUserProfileRoute(props.profile.handle)}
                trackData={subTrackData}
            >
                {subTrackData.name === 'MARATHON_MATCH' || subTrackData.name === 'SRM' ? (
                    <SRMView trackData={subTrackData} profile={props.profile} />
                ) : (
                    <DevelopTrackView trackData={subTrackData} profile={props.profile} />
                )}
            </StatsDetailsLayout>
        </div>
    )
}

export default SubTrackView
