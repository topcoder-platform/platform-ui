import { FC } from 'react'

import styles from './LoadingCircles.module.scss'

interface LoadingCirclesProps {
  className?: string
}

const LoadingCircles: FC<LoadingCirclesProps> = props => (
    <svg className={[styles.container, props.className].join(' ')} viewBox='0 0 64 64'>
        <circle className={styles['circle-outer']} cx='50%' cy='50%' r='0' />
        <circle className={styles['circle-inner']} cx='50%' cy='50%' r='0' />
    </svg>
)

export default LoadingCircles
