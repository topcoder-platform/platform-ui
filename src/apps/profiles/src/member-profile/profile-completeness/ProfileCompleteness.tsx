import { FC, useEffect, useMemo } from 'react'
import { startCase } from 'lodash'

import { useProfileCompleteness, UserProfile } from '~/libs/core'

import styles from './ProfileCompleteness.module.scss'

interface ProfileCompletenessProps {
    profile: UserProfile
    isAdminOrTM?: boolean
    isSelf: boolean
}

const ProfileCompleteness: FC<ProfileCompletenessProps> = props => {
    const completeness = useProfileCompleteness(props.profile.handle)
    const completed = Number(completeness.percent?.toFixed(2))
    const isLoading = completeness.isLoading
    const isCompleted = completed === 100

    const hideCompletenessMeter = isLoading || isCompleted

    useEffect(() => { completeness?.mutate() }, [props.profile])

    const [count, incompleteEntries] = useMemo(() => {
        const fields = Object.entries(completeness.entries)
            .filter(([, value]) => value === false || value === null || value === undefined)
            .map(([key]) => startCase(key))

        if (fields.length === 2) {
            return [2, fields.join(' and ')]
        }

        if (fields.length >= 2) {
            fields[fields.length - 1] = `and ${fields[fields.length - 1]}`
        }

        return [fields.length, fields.join(', ')]
    }, [completeness.entries])

    return hideCompletenessMeter ? <></> : (
        <div className={styles.wrap}>
            <strong>Profile: </strong>
            {`${completed}% Complete`}
            {props.isSelf
            && (
                <div>
                    <small>
                        Only
                        {' '}
                        {incompleteEntries}
                        {' '}
                        left to fill. Please add
                        {' '}
                        {count === 1 ? 'it' : 'them'}
                        {' '}
                        to make your profile more discoverable.
                    </small>
                </div>
            )}
            {props.isAdminOrTM && !props.isSelf
            && (
                <div>
                    <small>
                        {incompleteEntries}
                        {' '}
                        left to fill by the member.
                    </small>
                </div>
            )}
        </div>
    )
}

export default ProfileCompleteness
