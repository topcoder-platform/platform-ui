/**
 * LoadingSpinner
 *
 * Centered Loading Spinner with back overlay
 */
import { FC, forwardRef, RefAttributes } from 'react'
import { PuffLoader } from 'react-spinners'
import classNames from 'classnames'

import styles from './LoadingSpinner.module.scss'

// This will determine whether we want to show the loading indicator on top of existing content or if its shown
// without any content
type LoadingSpinnerType = 'Overlay' | 'Normal'

export interface LoadingSpinnerProps {
    className?: string
    hide?: boolean
    type?: LoadingSpinnerType
}

const LoadingSpinner: FC<LoadingSpinnerProps & RefAttributes<HTMLDivElement>>
= forwardRef<HTMLDivElement, LoadingSpinnerProps>((props, ref) => {
    if (!!props.hide) {
        return <></>
    }

    const isOverlay: boolean = props.type === 'Overlay'
    return (
        <div
            ref={ref}
            className={
                classNames(styles['loading-spinner'], styles.show, { [styles.overlay]: isOverlay }, props.className)
            }
        >
            <PuffLoader color='#2196f3' loading size={100} />
        </div>
    )
})

export default LoadingSpinner
