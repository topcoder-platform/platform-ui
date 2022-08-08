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
    hide?: boolean
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ hide, className }: LoadingSpinnerProps) => {

    if (!!hide) {
        return <></>
    }

    return (
        <div className={classNames(styles['loading-spinner'], styles.show, className)}>
            <PuffLoader color={'#2196f3'} loading={true} size={100} />
        </div>
    )
}

export default LoadingSpinner
