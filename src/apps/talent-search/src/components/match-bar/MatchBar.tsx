import { FC } from 'react'
import classNames from 'classnames'

import styles from './MatchBar.module.scss'

interface MatchBarProps {
    className?: string
    percent?: number
}

const MatchBar: FC<MatchBarProps> = props => {
    const value = Math.round((props.percent ?? 0) * 100)

    return (
        <div
            className={classNames(props.className, styles.wrap, value < 70 && 'dark')}
            style={{ backgroundPositionY: `${value}%` }}
        >
            <strong>
                {value}
                %
            </strong>
            <span className='body-medium-normal'>Match</span>
        </div>
    )
}

export default MatchBar
