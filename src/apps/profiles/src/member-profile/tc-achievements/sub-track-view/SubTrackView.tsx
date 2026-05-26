import { FC, ReactElement, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { isEmpty } from 'lodash'

import { MemberStats, UserProfile } from '~/libs/core'

import { useFetchSubTrackData, useTrackHistory } from '../../../hooks'
import { StatsDetailsLayout } from '../../../components/tc-achievements/StatsDetailsLayout'
import { DevelopTrackView } from '../../../components/tc-achievements/DevelopTrackView'
import { SRMView } from '../../../components/tc-achievements/SRMView'
import { subTrackLabelToHumanName } from '../../../lib'
import { MemberProfileContextValue, useMemberProfileContext } from '../../MemberProfile.context'

import styles from './SubTrackView.module.scss'

interface SubTrackViewProps {
    profile: UserProfile
    renderDefault: () => ReactElement
}

const SubTrackView: FC<SubTrackViewProps> = props => {
    const { statsRoute }: MemberProfileContextValue = useMemberProfileContext()
    const params = useParams()

    const subTrackResult = useFetchSubTrackData(props.profile.handle, params.trackType, params.subTrack)
    const { trackData, ...subTrackData }: any = subTrackResult ?? {}
    const trackHistory = useTrackHistory(props.profile.handle, subTrackData as MemberStats | undefined)

    const [backRoute, prevTitle] = useMemo(() => {
        const trackName = trackData?.subTracks?.length === 1 ? '' : trackData?.name ?? ''
        return [
            statsRoute(props.profile.handle, trackName),
            trackName || 'Member Stats',
        ]
    }, [props.profile.handle, statsRoute, trackData?.name, trackData?.subTracks])

    return (!trackData || isEmpty(subTrackData)) ? props.renderDefault() : (
        <div className={styles.wrap}>
            <StatsDetailsLayout
                prevTitle={prevTitle}
                title={subTrackLabelToHumanName(subTrackData.name)}
                backAction={backRoute}
                closeAction={statsRoute(props.profile.handle)}
                trackData={subTrackData}
            >
                {subTrackData.name === 'SRM' ? (
                    <SRMView trackData={subTrackData} profile={props.profile} />
                ) : (
                    <DevelopTrackView trackData={subTrackData} trackHistory={trackHistory} />
                )}
            </StatsDetailsLayout>
        </div>
    )
}

export default SubTrackView
