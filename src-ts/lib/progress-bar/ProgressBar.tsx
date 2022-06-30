import React, { FC } from 'react'

import styles from './ProgressBar.module.scss'

interface ProgressBarProps {
    progress: number
}

const ProgressBar: FC<ProgressBarProps> = (props: ProgressBarProps) => {

    return (
        <div className={styles['wrap']}>
            <div className='progress' style={{'--progress': props.progress} as React.CSSProperties}></div>
        </div>
    )
}

export default ProgressBar
