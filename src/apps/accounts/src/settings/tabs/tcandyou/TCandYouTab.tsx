import { FC } from 'react'

import { UserProfile, UserTraits } from '~/libs/core'

import { Tracks } from './tracks'
import { Communities } from './communities'
import styles from './TCandYouTab.module.scss'

interface TCandYouTabProps {
    profile: UserProfile
    memberTraits: UserTraits[] | undefined
}

const TCandYouTab: FC<TCandYouTabProps> = (props: TCandYouTabProps) => (
    <div className={styles.container}>
        <h3>You And Topcoder</h3>

        <Tracks profile={props.profile} />

        <Communities
            communityTraits={props.memberTraits?.find(trait => trait.traitId === 'communities')}
            profile={props.profile}
        />
    </div>
)

export default TCandYouTab
