/**
 * LoadingSpinner
 *
 * Centered Loading Spinner with back overlay
 */
import { FC } from 'react'
import classNames from 'classnames'

import { LoadingCircles } from '../loading-circles'

import styles from './LoadingSpinner.module.scss'

export interface LoadingSpinnerProps {
    className?: string
    hide?: boolean
    inline?: boolean
    overlay?: boolean
    message?: string
}

const LoadingSpinner: FC<LoadingSpinnerProps> = (props: LoadingSpinnerProps) => {
    if (!!props.hide) {
        return <></>
    }

    return (
        <div
            className={classNames(
                props.className,
                styles['loading-spinner'],
                props.inline && styles.inline,
                props.overlay && styles.overlay,
            )}
        >
            <LoadingCircles />
            {props.message && <div className={styles.message}>{props.message}</div>}
        </div>
    )
}

export default LoadingSpinner
