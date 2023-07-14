import { FC } from 'react'
import classNames from 'classnames'

import { IconOutline, Tooltip, VerifiedMemberFlagSvg } from '~/libs/ui'

import styles from './VerifiedMemberBadge.module.scss'

interface VerifiedMemberBadgeProps {
    containerClass?: string
}

const VerifiedMemberBadge: FC<VerifiedMemberBadgeProps> = (props: VerifiedMemberBadgeProps) => (
    <div className={classNames(styles.verifyStatus, props.containerClass)}>
        <VerifiedMemberFlagSvg />
        <span className='overline'>verified member</span>
        <Tooltip
            content='This member is compliant with Topcoder policies and is a trusted member of the Topcoder community.'
        >
            <IconOutline.InformationCircleIcon
                className={styles.toolTipIcon}
            />
        </Tooltip>
    </div>
)

export default VerifiedMemberBadge
