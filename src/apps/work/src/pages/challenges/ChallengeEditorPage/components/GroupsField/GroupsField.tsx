import {
    FC,
    useCallback,
    useContext,
    useState,
} from 'react'
import { useFormContext } from 'react-hook-form'

import {
    BaseModal,
    IconOutline,
} from '~/libs/ui'

import { WorkAppContext } from '../../../../../lib/contexts/WorkAppContext'
import {
    Group,
    GroupBulkCreateResponse,
} from '../../../../../lib/models'
import { FormGroupsSelect } from '../../../../../lib/components/form'
import { GroupsPage } from '../../../../groups'

import styles from './GroupsField.module.scss'

export const GroupsField: FC = () => {
    const formContext = useFormContext()
    const workAppContext = useContext(WorkAppContext)
    const [createdGroups, setCreatedGroups] = useState<Group[]>([])
    const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false)
    const canManageGroups = workAppContext.isAdmin || workAppContext.isCopilot || workAppContext.isManager

    const handleCreateGroupModalClose = useCallback((): void => {
        setShowCreateGroupModal(false)
    }, [])

    const handleCreateGroupModalOpen = useCallback((): void => {
        setShowCreateGroupModal(true)
    }, [])

    const handleCreateGroupSuccess = useCallback(
        (createdGroup: GroupBulkCreateResponse): void => {
            const createdGroupId = createdGroup.id.trim()
            const createdGroupName = createdGroup.name.trim()

            if (!createdGroupId || !createdGroupName) {
                return
            }

            setCreatedGroups(previousGroups => (
                previousGroups.some(group => group.id === createdGroupId)
                    ? previousGroups
                    : [
                        ...previousGroups,
                        {
                            id: createdGroupId,
                            name: createdGroupName,
                        },
                    ]
            ))

            const currentGroups = Array.isArray(formContext.getValues('groups'))
                ? formContext.getValues('groups')
                    .map((groupId: unknown) => (typeof groupId === 'string'
                        ? groupId.trim()
                        : ''))
                    .filter(Boolean)
                : []

            formContext.setValue(
                'groups',
                Array.from(new Set([
                    ...currentGroups,
                    createdGroupId,
                ])),
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            )
        },
        [formContext],
    )

    return (
        <div className={styles.container}>
            <div className={styles.selectField}>
                <div className={styles.fieldHeader}>
                    <label className={styles.fieldLabel} htmlFor='groups'>
                        Groups
                    </label>
                    {canManageGroups
                        ? (
                            <button
                                aria-label='Create Group'
                                className={styles.createGroupButton}
                                onClick={handleCreateGroupModalOpen}
                                title='Create Group'
                                type='button'
                            >
                                <IconOutline.PlusIcon aria-hidden='true' />
                            </button>
                        )
                        : undefined}
                </div>
                <FormGroupsSelect
                    additionalGroups={createdGroups}
                    hideLabel
                    label='Groups'
                    name='groups'
                />
            </div>
            {showCreateGroupModal
                ? (
                    <BaseModal
                        open
                        onClose={handleCreateGroupModalClose}
                        size='lg'
                    >
                        <GroupsPage
                            embedded
                            onClose={handleCreateGroupModalClose}
                            onCreateSuccess={handleCreateGroupSuccess}
                        />
                    </BaseModal>
                )
                : undefined}
        </div>
    )
}

export default GroupsField
