import { FC } from 'react'

import styles from './TCOWinsBanner.module.scss'

interface TCOWinsBannerProps {
    tcoWins: number
}

const TCOWinsBanner: FC<TCOWinsBannerProps> = (props: TCOWinsBannerProps) => (
    <div className={styles.container}>
        <p className='body-large-bold'>Topcoder Open (TCO)</p>
        <p className={styles.wins}>
            {props.tcoWins}
            {' '}
            <span>{props.tcoWins === 1 ? 'time' : 'times'}</span>
        </p>
        <p className={styles.champText}>Champion</p>
        <p className={styles.text}>
            Topcoder Open (TCO) is the ultimate programming tournament,
            that earns our winners major prestige in the programming community.
        </p>
    </div>
)

export default TCOWinsBanner
