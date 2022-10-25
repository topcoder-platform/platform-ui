import classNames from 'classnames'
import { FC, ReactNode, RefObject, SVGProps, useRef } from 'react'
import ReactTooltip from 'react-tooltip'
import { v4 as uuidv4 } from 'uuid'

import { IconOutline, IconSolid } from '../svgs'

import styles from './HelpIcon.module.scss'

type InfoType = 'Help' | 'Info'
interface InfoIcon {
    [type: string]: FC<SVGProps<SVGSVGElement>>
}
const IconMap: InfoIcon  = {
    Help: IconOutline.QuestionMarkCircleIcon,
    Info: IconSolid.InformationCircleIcon,
}
export interface HelpIconProps {
    arrowColor?: string
    backgroundColor?: string
    children: ReactNode
    className?: string
    inverted?: boolean
    textColor?: string
    type?: InfoType
}

const HelpIcon: FC<HelpIconProps> = ({
    children,
    className,
    inverted,
    arrowColor = '#f4f4f4',
    backgroundColor = '#f4f4f4',
    textColor = '#00000',
    type = 'Help',
}: HelpIconProps) => {
    const tooltipId: RefObject<string> = useRef<string>(uuidv4())

    const Icon: FC<SVGProps<SVGSVGElement>> = IconMap[type]
    return (
        <div className={classNames(styles['help-icon-wrapper'], className)}>
            <Icon
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
