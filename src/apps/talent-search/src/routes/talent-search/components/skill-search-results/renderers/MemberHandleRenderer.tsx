import { IconOutline } from '~/libs/ui'
import { EnvironmentConfig } from '~/config'

import Member from '@talentSearch/lib/models/Member'

import styles from './MemberHandleRenderer.module.scss'

const MemberHandleRenderer: (member:Member) => JSX.Element
= (member:Member): JSX.Element => {
    function handleOpenLink(): void {
        window.open(`${EnvironmentConfig.URLS.USER_PROFILE}/${member.handle}`, '_blank')
    }

    return (
        <div className={styles.memberCell}>
            <a onClick={handleOpenLink} className={styles.memberHandle}>{member.handle}</a>
            <IconOutline.ExternalLinkIcon
                className={styles.profileLink}
                onClick={handleOpenLink}
            />
        </div>
    )
}

export default MemberHandleRenderer
