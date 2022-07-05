import React, { FC } from 'react'

import styles from './ProgressBar.module.scss'

interface ProgressBarProps {
    progress: number
}

const ProgressBar: FC<ProgressBarProps> = (props: ProgressBarProps) => {

    const progressProps: React.CSSProperties = {
        '--progress': props.progress,
    } as unknown as React.CSSProperties

    return (
        <div className={styles['wrap']}>
            <div className='progress' style={progressProps}></div>
        </div>
    )
}

export default ProgressBar
