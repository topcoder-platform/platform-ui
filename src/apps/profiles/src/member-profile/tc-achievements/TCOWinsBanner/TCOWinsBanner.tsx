import { FC } from 'react'

import styles from './TCOWinsBanner.module.scss'

interface TCOWinsBannerProps {
    tcoWins: number
    tcoQualifications: number
}

const TCOWinsBanner: FC<TCOWinsBannerProps> = (props: TCOWinsBannerProps) => (
    <div className={styles.container}>
        <div className={styles.innerWrapper}>
            <p className='body-large-bold'>Topcoder Open (TCO)</p>
            <p className={styles.wins}>
                {
                    props.tcoWins === 1 || props.tcoQualifications === 1 ? (
                        <></>
                    ) : (
                        <>
                            {props.tcoWins || props.tcoQualifications}
                            {' '}
                            <span>time</span>
                        </>
                    )
                }
            </p>
            <p className={styles.champText}>{props.tcoWins ? 'Champion' : 'Finalist'}</p>
            <p>
                Topcoder Open (TCO) is the ultimate programming tournament,
                that earns our winners major prestige in the programming community.
            </p>
        </div>
    </div>
)

export default TCOWinsBanner
