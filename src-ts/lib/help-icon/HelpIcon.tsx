import classNames from 'classnames'
import { FC, ReactNode, RefObject, useRef } from 'react'
import ReactTooltip from 'react-tooltip'
import { v4 as uuidv4 } from 'uuid'

import { IconOutline } from '../'

import styles from './HelpIcon.module.scss'

export interface HelpIconProps {
  arrowColor?: string
  backgroundColor?: string
  children: ReactNode
  className?: string
  inverted?: boolean
  textColor?: string
}

const HelpIcon: FC<HelpIconProps> = ({
  children,
  className,
  inverted,
  arrowColor = '#f4f4f4',
  backgroundColor = '#f4f4f4',
  textColor = '#00000',
}: HelpIconProps) => {
  const tooltipId: RefObject<string> = useRef<string>(uuidv4())

  return (
    <div className={classNames(styles['help-icon-wrapper'], className)}>
      <IconOutline.QuestionMarkCircleIcon
        width={16}
        height={16}
        data-tip
        data-for={tooltipId.current}
        className={styles['help-icon']}
      />
      <ReactTooltip
        arrowColor={arrowColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
        className={classNames(styles['tooltip'], { [styles.inverted]: inverted })}
        id={tooltipId.current}
        aria-haspopup='true'
        place='bottom'
        effect='solid'
      >
        {children}
      </ReactTooltip>
    </div>
  )
}

export default HelpIcon
