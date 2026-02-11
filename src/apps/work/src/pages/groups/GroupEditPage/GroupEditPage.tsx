/* eslint-disable complexity */
/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    SubmitHandler,
    useForm,
} from 'react-hook-form'
import {
    Link,
    useParams,
} from 'react-router-dom'

import { yupResolver } from '@hookform/resolvers/yup'
import {
    Button,
    LoadingSpinner,
    PageTitle,
} from '~/libs/ui'

import {
    ErrorMessage,
    NullLayout,
} from '../../../lib/components'
import {
    GroupMember,
    GroupMembershipType,
} from '../../../lib/models'
import {
    groupsFormSchema,
    GroupsFormSchemaData,
} from '../../../lib/schemas/groups.schema'
import {
    addGroupMember,
    fetchGroupById,
    fetchGroupMembers,
    fetchMembersByUserIds,
    patchGroup,
    removeGroupMember,
    updateGroup,
} from '../../../lib/services'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'

import styles from './GroupEditPage.module.scss'

interface GroupEditFormValues extends GroupsFormSchemaData {
    oldId: string
}

interface MemberProfile {
    email?: string
    handle?: string
    userId: string
}

const DEFAULT_FORM_VALUES: GroupEditFormValues = {
    groupDescription: '',
    groupName: '',
    oldId: '',
    privateGroup: true,
    selfRegister: false,
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallbackMessage
}

function toMemberProfilesMap(memberProfiles: MemberProfile[]): Record<string, MemberProfile> {
    return memberProfiles.reduce(
        (
            accumulator: Record<string, MemberProfile>,
            memberProfile: MemberProfile,
        ): Record<string, MemberProfile> => {
            accumulator[memberProfile.userId] = memberProfile

            return accumulator
        },
        {},
    )
}

function getMembershipTypeLabel(membershipType: GroupMembershipType): string {
    if (membershipType === 'group') {
        return 'Group'
    }

    return 'User'
}

export const GroupEditPage: FC = () => {
    const params: Readonly<{
        groupId?: string
    }> = useParams<'groupId'>()
    const groupId = params.groupId || ''

    const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)
    const [groupName, setGroupName] = useState<string>('')
    const [isLoadingGroup, setIsLoadingGroup] = useState<boolean>(true)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [originalOldId, setOriginalOldId] = useState<string>('')

    const [isMembersLoading, setIsMembersLoading] = useState<boolean>(false)
    const [membersErrorMessage, setMembersErrorMessage] = useState<string | undefined>(undefined)
    const [members, setMembers] = useState<GroupMember[]>([])
    const [memberProfilesByUserId, setMemberProfilesByUserId] = useState<Record<string, MemberProfile>>({})
    const [memberMutationErrorMessage, setMemberMutationErrorMessage] = useState<string | undefined>(undefined)
    const [isAddingMember, setIsAddingMember] = useState<boolean>(false)
    const [newMemberId, setNewMemberId] = useState<string>('')
    const [newMemberType, setNewMemberType] = useState<GroupMembershipType>('user')
    const [removingMemberId, setRemovingMemberId] = useState<string | undefined>(undefined)

    const formMethods = useForm<GroupEditFormValues>({
        defaultValues: DEFAULT_FORM_VALUES,
        mode: 'onChange',
        resolver: yupResolver(groupsFormSchema) as any,
    })

    const loadMembers = useCallback(async (): Promise<void> => {
        if (!groupId) {
            return
        }

        setMembersErrorMessage(undefined)
        setIsMembersLoading(true)

        try {
            const loadedMembers = await fetchGroupMembers(groupId)
            const userMemberIds = Array.from(
                new Set(loadedMembers
                    .filter(member => member.membershipType === 'user')
                    .map(member => member.memberId)),
            )

            let loadedMemberProfilesByUserId: Record<string, MemberProfile> = {}

            if (userMemberIds.length > 0) {
                const memberProfiles = await fetchMembersByUserIds(userMemberIds)
                loadedMemberProfilesByUserId = toMemberProfilesMap(memberProfiles)
            }

            setMemberProfilesByUserId(loadedMemberProfilesByUserId)
            setMembers(loadedMembers)
        } catch (error) {
            setMembersErrorMessage(getErrorMessage(error, 'Unable to load group members.'))
        } finally {
            setIsMembersLoading(false)
        }
    }, [groupId])

    const loadGroup = useCallback(async (): Promise<void> => {
        if (!groupId) {
            setApiErrorMessage('Group id is missing.')
            setIsLoadingGroup(false)

            return
        }

        setApiErrorMessage(undefined)
        setIsLoadingGroup(true)

        try {
            const group = await fetchGroupById(groupId)
            const nextOldId = group.oldId || ''

            setGroupName(group.name)
            setOriginalOldId(nextOldId)
            formMethods.reset({
                groupDescription: group.description || '',
                groupName: group.name,
                oldId: nextOldId,
                privateGroup: group.privateGroup ?? true,
                selfRegister: group.selfRegister ?? false,
            })
        } catch (error) {
            setApiErrorMessage(getErrorMessage(error, 'Unable to load group details.'))
        } finally {
            setIsLoadingGroup(false)
        }
    }, [formMethods, groupId])

    useEffect(() => {
        loadGroup()
            .catch(() => undefined)
    }, [loadGroup])

    useEffect(() => {
        loadMembers()
            .catch(() => undefined)
    }, [loadMembers])

    const handleSave: SubmitHandler<GroupEditFormValues> = useCallback(async (
        formData: GroupEditFormValues,
    ): Promise<void> => {
        if (!groupId || isSaving) {
            return
        }

        setApiErrorMessage(undefined)
        setIsSaving(true)

        try {
            const normalizedOldId = formData.oldId.trim()

            if (normalizedOldId && normalizedOldId !== originalOldId) {
                await patchGroup(groupId, {
                    oldId: normalizedOldId,
                })
            }

            const updatedGroup = await updateGroup(groupId, {
                description: formData.groupDescription.trim(),
                name: formData.groupName.trim(),
                oldId: normalizedOldId || undefined,
                privateGroup: formData.privateGroup,
                selfRegister: formData.selfRegister,
            })

            const nextOldId = updatedGroup.oldId || normalizedOldId

            setGroupName(updatedGroup.name)
            setOriginalOldId(nextOldId)
            formMethods.reset({
                groupDescription: updatedGroup.description || formData.groupDescription.trim(),
                groupName: updatedGroup.name,
                oldId: nextOldId,
                privateGroup: updatedGroup.privateGroup ?? formData.privateGroup,
                selfRegister: updatedGroup.selfRegister ?? formData.selfRegister,
            })

            showSuccessToast('Group updated successfully')
        } catch (error) {
            const errorMessage = getErrorMessage(error, 'Failed to update group.')

            setApiErrorMessage(errorMessage)
            showErrorToast(errorMessage)
        } finally {
            setIsSaving(false)
        }
    }, [formMethods, groupId, isSaving, originalOldId])

    const handleAddMember = useCallback(async (): Promise<void> => {
        if (!groupId || isAddingMember) {
            return
        }

        const normalizedMemberId = newMemberId.trim()

        if (!normalizedMemberId) {
            setMemberMutationErrorMessage('Member ID is required.')
            return
        }

        setMemberMutationErrorMessage(undefined)
        setIsAddingMember(true)

        try {
            await addGroupMember(groupId, {
                memberId: normalizedMemberId,
                membershipType: newMemberType,
            })
            setNewMemberId('')
            showSuccessToast('Member added successfully')
            await loadMembers()
        } catch (error) {
            const errorMessage = getErrorMessage(error, 'Failed to add group member.')

            setMemberMutationErrorMessage(errorMessage)
            showErrorToast(errorMessage)
        } finally {
            setIsAddingMember(false)
        }
    }, [groupId, isAddingMember, loadMembers, newMemberId, newMemberType])

    const handleRemoveMember = useCallback(async (member: GroupMember): Promise<void> => {
        if (!groupId || removingMemberId) {
            return
        }

        setMemberMutationErrorMessage(undefined)
        setRemovingMemberId(member.memberId)

        try {
            await removeGroupMember(groupId, member.memberId)
            showSuccessToast('Member removed successfully')
            await loadMembers()
        } catch (error) {
            const errorMessage = getErrorMessage(error, 'Failed to remove group member.')

            setMemberMutationErrorMessage(errorMessage)
            showErrorToast(errorMessage)
        } finally {
            setRemovingMemberId(undefined)
        }
    }, [groupId, loadMembers, removingMemberId])

    const onSubmit = formMethods.handleSubmit(handleSave)

    const memberRows = useMemo(() => members
        .map(member => {
            const memberProfile = memberProfilesByUserId[member.memberId]

            return {
                handle: memberProfile?.handle || '-',
                id: member.id,
                memberId: member.memberId,
                membershipType: member.membershipType,
                secondaryText: memberProfile?.email || member.universalUID || '-',
            }
        }), [
        memberProfilesByUserId,
        members,
    ])

    if (!groupId) {
        return (
            <NullLayout>
                <PageTitle>Edit Group</PageTitle>
                <ErrorMessage message='Group id is missing.' />
            </NullLayout>
        )
    }

    return (
        <NullLayout>
            <PageTitle>Edit Group</PageTitle>

            <div className={styles.pageContainer}>
                <div className={styles.headerRow}>
                    <h3 className={styles.pageHeading}>
                        {groupName
                            ? `Edit Group: ${groupName}`
                            : 'Edit Group'}
                    </h3>
                    <Link className={styles.backLink} to='/groups'>
                        Back to Groups
                    </Link>
                </div>

                {apiErrorMessage
                    ? (
                        <div className={styles.errorBanner} role='alert'>
                            {apiErrorMessage}
                        </div>
                    )
                    : undefined}

                {isLoadingGroup
                    ? (
                        <div className={styles.loadingState}>
                            <LoadingSpinner inline />
                            <span className={styles.loadingText}>Loading group details...</span>
                        </div>
                    )
                    : (
                        <form className={styles.form} onSubmit={onSubmit}>
                            <div className={styles.formRow}>
                                <label className={styles.fieldLabel} htmlFor='groupName'>
                                    Group Name
                                    <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.fieldValue}>
                                    <input
                                        className={styles.textInput}
                                        id='groupName'
                                        type='text'
                                        {...formMethods.register('groupName')}
                                    />
                                    {formMethods.formState.errors.groupName?.message
                                        ? (
                                            <div className={styles.fieldError}>
                                                {formMethods.formState.errors.groupName.message}
                                            </div>
                                        )
                                        : undefined}
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <label className={styles.fieldLabel} htmlFor='groupDescription'>
                                    Description
                                    <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.fieldValue}>
                                    <textarea
                                        className={styles.textArea}
                                        id='groupDescription'
                                        rows={4}
                                        {...formMethods.register('groupDescription')}
                                    />
                                    {formMethods.formState.errors.groupDescription?.message
                                        ? (
                                            <div className={styles.fieldError}>
                                                {formMethods.formState.errors.groupDescription.message}
                                            </div>
                                        )
                                        : undefined}
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <label className={styles.fieldLabel} htmlFor='oldId'>
                                    Old ID
                                </label>
                                <div className={styles.fieldValue}>
                                    <input
                                        className={styles.textInput}
                                        id='oldId'
                                        type='text'
                                        {...formMethods.register('oldId')}
                                    />
                                    <span className={styles.helperText}>
                                        Old ID changes are sent through the patch endpoint before update.
                                    </span>
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <span className={styles.fieldLabel}>Group Options</span>
                                <div className={styles.fieldValue}>
                                    <div className={styles.checkboxGroup}>
                                        <label className={styles.checkboxItem} htmlFor='selfRegister'>
                                            <input
                                                id='selfRegister'
                                                type='checkbox'
                                                {...formMethods.register('selfRegister')}
                                            />
                                            <span>Self Registration</span>
                                        </label>
                                        <label className={styles.checkboxItem} htmlFor='privateGroup'>
                                            <input
                                                id='privateGroup'
                                                type='checkbox'
                                                {...formMethods.register('privateGroup')}
                                            />
                                            <span>Private</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.buttonRow}>
                                <Button
                                    disabled={isSaving}
                                    label={isSaving ? 'Saving...' : 'Save Group'}
                                    primary
                                    size='lg'
                                    type='submit'
                                />
                            </div>
                        </form>
                    )}

                <section className={styles.membersSection}>
                    <h4 className={styles.sectionHeading}>Members</h4>

                    <div className={styles.memberForm}>
                        <input
                            className={styles.textInput}
                            onChange={event => {
                                setNewMemberId(event.target.value)
                            }}
                            placeholder='Member ID'
                            type='text'
                            value={newMemberId}
                        />
                        <select
                            className={styles.typeSelect}
                            onChange={event => {
                                setNewMemberType(event.target.value as GroupMembershipType)
                            }}
                            value={newMemberType}
                        >
                            <option value='user'>User</option>
                            <option value='group'>Group</option>
                        </select>
                        <Button
                            disabled={isAddingMember || !newMemberId.trim()}
                            label={isAddingMember ? 'Adding...' : 'Add Member'}
                            onClick={handleAddMember}
                            primary
                            size='lg'
                        />
                    </div>

                    {membersErrorMessage
                        ? (
                            <div className={styles.errorBanner} role='alert'>
                                {membersErrorMessage}
                            </div>
                        )
                        : undefined}

                    {memberMutationErrorMessage
                        ? (
                            <div className={styles.errorBanner} role='alert'>
                                {memberMutationErrorMessage}
                            </div>
                        )
                        : undefined}

                    {isMembersLoading
                        ? (
                            <div className={styles.loadingState}>
                                <LoadingSpinner inline />
                                <span className={styles.loadingText}>Loading members...</span>
                            </div>
                        )
                        : undefined}

                    {!isMembersLoading && memberRows.length === 0
                        ? <div className={styles.emptyState}>No members found for this group.</div>
                        : undefined}

                    {!isMembersLoading && memberRows.length > 0
                        ? (
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th scope='col'>Member ID</th>
                                            <th scope='col'>Type</th>
                                            <th scope='col'>Handle</th>
                                            <th scope='col'>Email / UID</th>
                                            <th scope='col'>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {memberRows.map(memberRow => (
                                            <tr key={memberRow.id}>
                                                <td>{memberRow.memberId}</td>
                                                <td>{getMembershipTypeLabel(memberRow.membershipType)}</td>
                                                <td>{memberRow.handle}</td>
                                                <td>{memberRow.secondaryText}</td>
                                                <td>
                                                    <Button
                                                        disabled={
                                                            isAddingMember
                                                            || removingMemberId === memberRow.memberId
                                                        }
                                                        label={removingMemberId === memberRow.memberId
                                                            ? 'Removing...'
                                                            : 'Remove'}
                                                        onClick={() => {
                                                            const member = members
                                                                .find(groupMember => groupMember.id === memberRow.id)
                                                            if (member) {
                                                                handleRemoveMember(member)
                                                                    .catch(() => undefined)
                                                            }
                                                        }}
                                                        secondary
                                                        size='lg'
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                        : undefined}
                </section>
            </div>
        </NullLayout>
    )
}

export default GroupEditPage
