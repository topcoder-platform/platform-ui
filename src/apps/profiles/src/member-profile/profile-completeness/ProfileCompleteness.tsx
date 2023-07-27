import { FC } from 'react'

import { useProfileCompleteness, UserProfile } from '~/libs/core'

import styles from './ProfileCompleteness.module.scss'

interface ProfileCompletenessProps {
    profile: UserProfile
}

const ProfileCompleteness: FC<ProfileCompletenessProps> = props => {
    const completed = useProfileCompleteness(props.profile.handle)
    const isLoading = completed === undefined
    const isCompleted = completed === 100

    const isCustomer = props.profile.roles.some(r => r.indexOf(' Customer') > -1)

    const hideCompletenessMeter = isLoading || isCompleted || isCustomer

    return hideCompletenessMeter ? <></> : (
        <div className={styles.wrap}>
            <strong>Profile: </strong>
            {`${completed}% Complete`}
        </div>
    )
}

export default ProfileCompleteness
