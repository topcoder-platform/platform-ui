/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
import React, { FC, useMemo } from 'react'
import classNames from 'classnames'

import styles from './styles.module.scss'

interface ProgressBarProps {
    progress: number
    maxStep: number
    className?: string
}

export const ProgressBar: FC<ProgressBarProps> = (props: ProgressBarProps) => {
    const progresses = useMemo(() => Array.from(Array(props.maxStep), (_, index) => index), [props.maxStep])
    return (
        <div className={classNames(props.className, styles.container, 'd-flex')}>
            {progresses.map(item => (
                <div
                    key={item}
                    className={classNames(styles.blockProgress, {
                        [styles.active]: item < props.progress,
                    })}
                />
            ))}

        </div>
    )
}

export default ProgressBar
