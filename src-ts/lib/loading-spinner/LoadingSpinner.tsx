/**
 * LoadingSpinner
 *
 * Centered Loading Spinner with back overlay
 */
import classNames from 'classnames'
import { FC } from 'react'
import { PuffLoader } from 'react-spinners'

import styles from './LoadingSpinner.module.scss'

export interface LoadingSpinnerProps {
    className?: string
    show?: boolean
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ show = false, className }: LoadingSpinnerProps) => {
    return (
        <div className={classNames(styles['loading-spinner'], styles[show ? 'show' : 'hide'], className)}>
            <PuffLoader color={'#2196f3'} loading={true} size={100} />
        </div>
    )
}

export default LoadingSpinner
