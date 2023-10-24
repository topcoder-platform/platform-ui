import { FC, useEffect } from 'react'

import { useProfileCompleteness, UserProfile } from '~/libs/core'

import styles from './ProfileCompleteness.module.scss'

interface ProfileCompletenessProps {
    profile: UserProfile
    authProfile: UserProfile
}

const ProfileCompleteness: FC<ProfileCompletenessProps> = props => {
    const completeness = useProfileCompleteness(props.profile.handle)
    const completed = completeness.percent
    const isLoading = completeness.isLoading
    const isCompleted = completed === 100

    const isCustomer = props.authProfile.roles.some(r => r.indexOf(' Customer') > -1)

    const hideCompletenessMeter = isLoading || isCompleted || isCustomer

    useEffect(() => { completeness?.mutate() }, [props.profile])

    return hideCompletenessMeter ? <></> : (
        <div className={styles.wrap}>
            <strong>Profile: </strong>
            {`${completed}% Complete`}
        </div>
    )
}

export default ProfileCompleteness
