import { EnvironmentConfig } from '~/config'
import { IconOutline } from '~/libs/ui'

import { MemberBadgeAward } from '../../../../../game-lib'

import styles from './MemberHandleRenderer.module.scss'

const MemberHandleRenderer: (memberAward: MemberBadgeAward) => JSX.Element
= (memberAward: MemberBadgeAward): JSX.Element => {
    function handleOpenLink(): void {
        window.open(`${EnvironmentConfig.TOPCODER_URLS.USER_PROFILE}/${memberAward.user_handle}`, '_blank')
    }

    return (
        <div className={styles.memberAward}>
            <p className={styles.memberHandle}>{memberAward.user_handle}</p>
            <IconOutline.ExternalLinkIcon
                className={styles.profileLink}
                onClick={handleOpenLink}
            />
        </div>
    )
}

export default MemberHandleRenderer
