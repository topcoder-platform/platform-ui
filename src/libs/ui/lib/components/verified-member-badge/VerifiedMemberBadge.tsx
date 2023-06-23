import { FC } from 'react'

import { IconOutline, Tooltip, VerifiedMemberFlagSvg } from '~/libs/ui'

import styles from './VerifiedMemberBadge.module.scss'

const VerifiedMemberBadge: FC<{}> = () => (
    <div className={styles.verifyStatus}>
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
