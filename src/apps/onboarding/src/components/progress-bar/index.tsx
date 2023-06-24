/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
import React, { FC } from 'react'

import styles from './styles.module.scss'

interface ProgressBarProps {
    progress: number
    label?: string
    className?: string
}

export const ProgressBar: FC<ProgressBarProps> = (props: ProgressBarProps) => {

    const progressProps: React.CSSProperties & { '--progress': number } = {
        '--progress': props.progress,
    }

    return (
        <div className={props.className}>
            <span>{props.label}</span>
            <div className={styles.wrap}>
                <div
                    className='progress'
                    style={progressProps}
                />
            </div>
        </div>
    )
}

export default ProgressBar
