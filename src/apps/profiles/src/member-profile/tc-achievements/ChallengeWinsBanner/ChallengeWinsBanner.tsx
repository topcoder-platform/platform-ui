import { FC } from 'react'

import styles from './ChallengeWinsBanner.module.scss'

interface ChallengeWinsBannerProps {
    challengeWins: number
}

const ChallengeWinsBanner: FC<ChallengeWinsBannerProps> = (props: ChallengeWinsBannerProps) => (
    <div className={styles.containerWrap}>
        <div className={styles.container}>
            <p className='body-large-bold'>Topcoder Challenge Winner</p>
            <p className={styles.wins}>
                {props.challengeWins}
                {' '}
            </p>
            <p className='body-main'>WINS</p>
        </div>
        <p>
            Topcoder challenges are open competitions where community
            members participate in small units of work to deliver projects.
        </p>
    </div>
)

export default ChallengeWinsBanner
