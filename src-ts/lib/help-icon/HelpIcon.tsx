import { FC, MutableRefObject, useRef } from 'react'
import ReactTooltip from 'react-tooltip'
import { v4 as uuidv4 } from 'uuid'

import styles from './HelpIcon.module.scss'
import { ReactComponent as  HintIcon} from './icon-hint-green.svg'

export interface HelpIconProps {
  arrowColor?: string,
  backgroundColor?: string,
  children: React.ReactNode,
  inverted?: boolean
  textColor?: string
}

const HelpIcon: FC<HelpIconProps> = (props: HelpIconProps) => {
  const { arrowColor, backgroundColor, children, inverted, textColor }: HelpIconProps = props
  const tooltipId: MutableRefObject<string> = useRef(uuidv4())

  return (
    <div className={styles['help-icon']}>
      <HintIcon data-tip data-for={tooltipId.current} />
      <ReactTooltip
        arrowColor={arrowColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
        className={[styles['tooltip'], inverted ? styles['inverted'] : ''].join(' ')}
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

HelpIcon.defaultProps = {
  arrowColor: '#f4f4f4',
  backgroundColor: '#f4f4f4',
  textColor: '#00000',
}

export default HelpIcon
