import { FC } from 'react'

import styles from './ChallengeWin.module.scss'

interface ChallengeWinProps {
    typeName: string
    onClick: () => void
    winCnt: number
    winLabel?: string
}

const ChallengeWin: FC<ChallengeWinProps> = (props: ChallengeWinProps) => (
    <div className={styles.winWrapper} onClick={props.onClick}>
        <p className={styles.winCnt}>
            {props.winCnt}
            {' '}
        </p>
        <p className='body-ultra-small-bold'>{props.winLabel || 'WINS'}</p>
        <p className='body-small-bold'>{props.typeName}</p>
    </div>
)

export default ChallengeWin