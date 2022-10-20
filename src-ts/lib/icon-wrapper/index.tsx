import { FC } from 'react'
import classNames from 'classnames'

import styles from './IconWrapper.module.scss'

interface IconWrapperProps {
  className?: string
  icon: JSX.Element
}

const IconWrapper: FC<IconWrapperProps> = ({ className, icon }: IconWrapperProps) => (
  <div className={classNames(styles.iconWrapper, className)}>
    <>{icon}</>
  </div>
)

export default IconWrapper
