import { FC } from 'react'
import classNames from 'classnames'

import styles from './IconWrapper.module.scss'

interface IconWrapperProps {
  className?: string
  icon: JSX.Element
}

const IconWrapper: FC<IconWrapperProps> = (props: IconWrapperProps) => (
    <div className={classNames(styles.iconWrapper, props.className)}>
        <>{props.icon}</>
    </div>
)

export default IconWrapper
