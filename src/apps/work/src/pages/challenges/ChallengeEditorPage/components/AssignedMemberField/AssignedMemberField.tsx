import {
    FC,
    useCallback,
    useContext,
} from 'react'
import { useFormContext } from 'react-hook-form'

import { Button } from '~/libs/ui'

import { FormUserAutocomplete } from '../../../../../lib/components/form'
import { WorkAppContext } from '../../../../../lib/contexts'
import {
    ChallengeEditorFormData,
    WorkAppContextModel,
} from '../../../../../lib/models'

import styles from './AssignedMemberField.module.scss'

export const AssignedMemberField: FC = () => {
    const {
        loginUserInfo,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const formContext = useFormContext<ChallengeEditorFormData>()

    const assignToMe = useCallback((): void => {
        const currentUserId = loginUserInfo?.userId

        if (!currentUserId) {
            return
        }

        formContext.setValue('assignedMemberId', String(currentUserId), {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [formContext, loginUserInfo?.userId])

    return (
        <div className={styles.container}>
            <FormUserAutocomplete
                label='Assigned Member'
                name='assignedMemberId'
                placeholder='Search assigned member'
                valueField='userId'
            />
            <Button
                className={styles.assignButton}
                disabled={!loginUserInfo?.userId}
                label='Assign to me'
                onClick={assignToMe}
                secondary
            />
        </div>
    )
}

export default AssignedMemberField
