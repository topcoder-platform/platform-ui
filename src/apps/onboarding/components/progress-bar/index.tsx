import React, { FC } from 'react'

import styles from './styles.module.scss'

interface ProgressBarProps {
    progress: number
    className?: string
}

export const ProgressBar: FC<ProgressBarProps> = (props: ProgressBarProps) => {

    const progressProps: React.CSSProperties & { '--progress': number } = {
        '--progress': props.progress,
    }

    return (
        <div className={props.className}>
            <span>#/##</span>
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
