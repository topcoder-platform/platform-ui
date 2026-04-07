import { FC } from 'react'

import { LoadingSpinner as UiLoadingSpinner } from '~/libs/ui'

import styles from './LoadingSpinner.module.scss'

interface LoadingSpinnerProps {
    color?: string
    size?: 'lg' | 'md' | 'sm'
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = (props: LoadingSpinnerProps) => (
    <div
        className={styles.container}
        style={{
            color: props.color,
        }}
    >
        <UiLoadingSpinner inline className={styles[props.size || 'md']} />
    </div>
)

export default LoadingSpinner
