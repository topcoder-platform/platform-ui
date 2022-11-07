import { EnvironmentConfig } from '../../../../../../../config'
import { IconOutline } from '../../../../../../../lib'
import { MemberBadgeAward } from '../../../../../game-lib'

import styles from './MemberHandleRenderer.module.scss'

const MemberHandleRenderer = (memberAward: MemberBadgeAward): JSX.Element => (
    <div className={styles.memberAward}>
        <p className={styles.memberHandle}>{memberAward.user_handle}</p>
        <IconOutline.ExternalLinkIcon
            className={styles.profileLink}
            onClick={() => window.open(`${EnvironmentConfig.TOPCODER_URLS.USER_PROFILE}/${memberAward.user_handle}`, '_blank')}
        />
    </div>
)

export default MemberHandleRenderer
