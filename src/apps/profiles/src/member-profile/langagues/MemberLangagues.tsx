import { FC } from 'react'

import { UserProfile } from '~/libs/core'

import { EditMemberPropertyBtn } from '../../components'

import styles from './MemberLangagues.module.scss'

interface MemberLangaguesProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
}

const MemberLangagues: FC<MemberLangaguesProps> = (props: MemberLangaguesProps) => {
    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    function handleEditLangaguesClick(): void {
        console.log('handleEditLangaguesClick', props.profile)
    }

    return (
        <div className={styles.container}>
            <div className={styles.titleWrap}>
                <p className='body-main-bold'>My Langagues:</p>
                {
                    canEdit && (
                        <EditMemberPropertyBtn
                            onClick={handleEditLangaguesClick}
                        />
                    )
                }
            </div>
        </div>
    )
}

export default MemberLangagues
