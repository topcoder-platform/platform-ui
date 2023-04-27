/**
 * LoadingSpinner
 *
 * Centered Loading Spinner with back overlay
 */
import { FC, forwardRef, RefAttributes } from 'react'
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

const LoadingSpinner: FC<LoadingSpinnerProps & RefAttributes<HTMLDivElement>>
= forwardRef<HTMLDivElement, LoadingSpinnerProps>((props, ref) => {
    if (!!props.hide) {
        return <></>
    }

    return (
        <div
            ref={ref}
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
})

export default LoadingSpinner
