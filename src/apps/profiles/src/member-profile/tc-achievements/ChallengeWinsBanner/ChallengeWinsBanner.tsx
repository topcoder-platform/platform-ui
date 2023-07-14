import { FC } from 'react'

import { MemberStats, UserStats } from '~/libs/core'

import { subTrackLabelToHumanName } from '../../../lib/helpers'

import styles from './ChallengeWinsBanner.module.scss'

interface ChallengeWinsBannerProps {
    memberStats: UserStats
}

const ChallengeWinsBanner: FC<ChallengeWinsBannerProps> = (props: ChallengeWinsBannerProps) => (
    <div className={styles.containerWrap}>
        <div className={styles.container}>
            <p className='body-large-bold'>Topcoder Challenge Winner</p>
            <div className={styles.wins}>
                {
                    !!props.memberStats.DATA_SCIENCE?.SRM?.wins && (
                        <div className={styles.winWrapper}>
                            <p className={styles.winCnt}>
                                {props.memberStats.DATA_SCIENCE.SRM.wins}
                                {' '}
                            </p>
                            <p className='body-main'>WINS</p>
                            <p className='body-main-bold'>SRM</p>
                        </div>
                    )
                }
                {
                    !!props.memberStats.DATA_SCIENCE?.MARATHON_MATCH?.wins && (
                        <div className={styles.winWrapper}>
                            <p className={styles.winCnt}>
                                {props.memberStats.DATA_SCIENCE.MARATHON_MATCH.wins}
                                {' '}
                            </p>
                            <p className='body-main'>WINS</p>
                            <p className='body-main-bold'>Marathon Match</p>
                        </div>
                    )
                }
                {
                    !!props.memberStats.DEVELOP?.wins
                    && props.memberStats.DEVELOP?.subTracks.map((ms: MemberStats) => (ms.wins ? (
                        <div className={styles.winWrapper}>
                            <p className={styles.winCnt}>
                                {ms.wins}
                                {' '}
                            </p>
                            <p className='body-main'>WINS</p>
                            <p className='body-main-bold'>{subTrackLabelToHumanName(ms.name)}</p>
                        </div>
                    ) : undefined))
                }
                {
                    !!props.memberStats.DESIGN?.wins
                    && props.memberStats.DESIGN?.subTracks.map((ms: MemberStats) => (ms.wins ? (
                        <div className={styles.winWrapper}>
                            <p className={styles.winCnt}>
                                {ms.wins}
                                {' '}
                            </p>
                            <p className='body-main'>WINS</p>
                            <p className='body-main-bold'>{subTrackLabelToHumanName(ms.name)}</p>
                        </div>
                    ) : undefined))
                }
            </div>
        </div>
        <p>
            Topcoder challenges are open competitions where community
            members participate in small units of work to deliver projects.
        </p>
    </div>
)

export default ChallengeWinsBanner
