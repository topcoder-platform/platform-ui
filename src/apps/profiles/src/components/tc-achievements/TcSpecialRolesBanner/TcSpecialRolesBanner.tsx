import { FC, useMemo, useState } from 'react'

import { UserStats } from '~/libs/core'

import { MemberRolesInfoModal } from './MemberRolesInfoModal'
import styles from './TcSpecialRolesBanner.module.scss'

interface TcSpecialRolesBannerProps {
    memberStats: UserStats | undefined
}

const TcSpecialRolesBanner: FC<TcSpecialRolesBannerProps> = props => {
    const isCopilot: boolean
        = useMemo(() => !!props.memberStats?.COPILOT, [props.memberStats])

    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)

    function handleInfoModalClose(): void {
        setIsInfoModalOpen(false)
    }

    function handleInfoModalOpen(): void {
        setIsInfoModalOpen(true)
    }

    return !isCopilot ? <></> : (
        <div className={styles.rolesSection}>
            <div className={styles.rolesWrap}>
                <p className='body-main-medium'>Topcoder Special Roles:&nbsp;</p>
                <p>Copilot</p>
            </div>
            <button type='button' className={styles.link} onClick={handleInfoModalOpen}>
                What are special roles?
            </button>

            {isInfoModalOpen && (
                <MemberRolesInfoModal onClose={handleInfoModalClose} />
            )}
        </div>
    )
}

export default TcSpecialRolesBanner
