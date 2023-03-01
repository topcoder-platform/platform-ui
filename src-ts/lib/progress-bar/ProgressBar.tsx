import React, { FC } from 'react'
import classNames from 'classnames'

import styles from './ProgressBar.module.scss'

interface ProgressBarProps {
    progress: number
    track?: string
}

const ProgressBar: FC<ProgressBarProps> = (props: ProgressBarProps) => {

    const progressProps: React.CSSProperties & { '--progress': number } = {
        '--progress': props.progress,
    }

    const persentageProps: React.CSSProperties = {
        [props.progress >= 0.05 ? 'right' : 'left']: '4px',
    }

    const showPercentage: boolean = props.progress > 0 && props.progress < 1
    const showCompleted: boolean = props.progress === 1

    return (
        <div className={styles.wrap}>
            <div
                className={classNames(
                    showCompleted ? 'completed' : 'progress',
                    showCompleted ? `completed-${props.track?.toLowerCase() || 'dev'}` : '',
                )}
                style={progressProps}
            >
                {
                    !!showPercentage && (
                        <span className={styles.percentage} style={persentageProps}>
                            {Number(props.progress * 100)
                                .toFixed(0)}
                            %
                        </span>
                    )
                }
                {
                    !!showCompleted && (
                        <span className={styles.completedText}>Completed </span>
                    )
                }
            </div>
        </div>
    )
}

export default ProgressBar
