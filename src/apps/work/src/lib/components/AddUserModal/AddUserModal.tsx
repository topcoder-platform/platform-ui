import {
    FC,
    MouseEvent,
    useCallback,
    useMemo,
    useState,
} from 'react'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'

import { Button } from '~/libs/ui'

import { PROJECT_ROLES } from '../../constants/project-roles.constants'
import { ProjectMember } from '../../models'
import {
    addMemberToProject,
    fetchProfile,
    inviteMemberToProject,
    updateMemberRole,
} from '../../services'
import { ConfirmationModal } from '../ConfirmationModal'
import {
    FormRadioGroup,
    FormRadioOption,
    FormUserAutocomplete,
} from '../form'

import styles from './AddUserModal.module.scss'

interface AddUserFormData {
    memberHandle: string
    role: string
}

interface PendingRoleChange {
    action?: string
    currentRole: string
    handle: string
    memberId: string
    nextRole: string
}

export interface AddUserModalProps {
    projectId: string
    projectMembers: ProjectMember[]
    projectName?: string
    onClose: () => void
    onSuccess: () => Promise<void> | void
}

const roleOptions: FormRadioOption<string>[] = [
    {
        label: 'Read',
        value: PROJECT_ROLES.READ,
    },
    {
        label: 'Write',
        value: PROJECT_ROLES.WRITE,
    },
    {
        label: 'Full Access',
        value: PROJECT_ROLES.MANAGER,
    },
    {
        label: 'Copilot',
        value: PROJECT_ROLES.COPILOT,
    },
]

function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallbackMessage
}

function getRoleLabel(role: string): string {
    const matchedOption = roleOptions.find(option => option.value === role)

    return matchedOption?.label || role
}

function toRoleChangeAction(currentRole: string, nextRole: string): string | undefined {
    if (currentRole === PROJECT_ROLES.MANAGER && nextRole === PROJECT_ROLES.COPILOT) {
        return 'complete-copilot-requests'
    }

    return undefined
}

function findMemberByUserId(projectMembers: ProjectMember[], userId: number): ProjectMember | undefined {
    return projectMembers.find(member => Number(member.userId) === userId)
}

export const AddUserModal: FC<AddUserModalProps> = (props: AddUserModalProps) => {
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false)
    const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | undefined>(undefined)

    const formMethods = useForm<AddUserFormData>({
        defaultValues: {
            memberHandle: '',
            role: PROJECT_ROLES.READ,
        },
        mode: 'onChange',
    })

    const memberHandle = formMethods.watch('memberHandle')
    const selectedRole = formMethods.watch('role')

    const handleContainerClick = useCallback((event: MouseEvent<HTMLDivElement>): void => {
        event.stopPropagation()
    }, [])

    const createPendingRoleChange = useCallback(
        (
            member: ProjectMember,
            handle: string,
            nextRole: string,
        ): PendingRoleChange | undefined => {
            const memberId = member.id !== undefined && member.id !== null
                ? String(member.id)
                : ''
            const currentRole = typeof member.role === 'string'
                ? member.role
                    .trim()
                : ''

            if (!memberId || !currentRole) {
                return undefined
            }

            return {
                action: toRoleChangeAction(currentRole, nextRole),
                currentRole,
                handle,
                memberId,
                nextRole,
            }
        },
        [],
    )

    // eslint-disable-next-line complexity
    const onSubmit = formMethods.handleSubmit(async formData => {
        if (isSubmitting) {
            return
        }

        setIsSubmitting(true)
        setErrorMessage(undefined)

        try {
            const normalizedHandle = formData.memberHandle
                .trim()

            if (!normalizedHandle) {
                setErrorMessage('Please select a member.')
                return
            }

            const profile = await fetchProfile(normalizedHandle)
            const userId = Number(profile?.userId)
            const handle = profile?.handle
                ? profile.handle
                    .trim()
                : normalizedHandle

            if (!profile || !Number.isFinite(userId) || !handle) {
                setErrorMessage('Unable to resolve selected member.')
                return
            }

            const existingMember = findMemberByUserId(props.projectMembers, userId)

            if (existingMember) {
                const existingRole = typeof existingMember.role === 'string'
                    ? existingMember.role
                        .trim()
                    : ''

                if (existingRole === formData.role) {
                    setErrorMessage(`Member already has ${getRoleLabel(formData.role)} role.`)
                    return
                }

                const pendingChange = createPendingRoleChange(existingMember, handle, formData.role)

                if (!pendingChange) {
                    setErrorMessage('Unable to prepare role update for this member.')
                    return
                }

                setPendingRoleChange(pendingChange)
                return
            }

            if (formData.role === PROJECT_ROLES.COPILOT) {
                const inviteResponse = await inviteMemberToProject(props.projectId, {
                    handles: [handle],
                    role: formData.role,
                })

                if (inviteResponse.failed?.length) {
                    const firstFailure = inviteResponse.failed[0] as {
                        error?: string
                        message?: string
                        role?: string
                    }

                    if (firstFailure.error === 'ALREADY_MEMBER') {
                        const staleMember = findMemberByUserId(props.projectMembers, userId)

                        if (staleMember) {
                            const pendingChange = createPendingRoleChange(staleMember, handle, formData.role)
                            if (pendingChange) {
                                setPendingRoleChange(pendingChange)
                                return
                            }
                        }
                    }

                    setErrorMessage(
                        firstFailure.message
                        || 'Member cannot be invited with the selected role.',
                    )

                    return
                }

                await props.onSuccess()
                props.onClose()
                return
            }

            await addMemberToProject(props.projectId, userId, formData.role)
            await props.onSuccess()
            props.onClose()
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to add member'))
        } finally {
            setIsSubmitting(false)
        }
    })

    const roleChangeMessage = useMemo(() => {
        if (!pendingRoleChange) {
            return ''
        }

        return `${pendingRoleChange.handle} is already part of ${props.projectName || 'this project'} `
            + `with ${getRoleLabel(pendingRoleChange.currentRole)} role. `
            + `Change role to ${getRoleLabel(pendingRoleChange.nextRole)}?`
    }, [pendingRoleChange, props.projectName])

    const handleRoleChangeCancel = useCallback(() => {
        if (isUpdatingRole) {
            return
        }

        setPendingRoleChange(undefined)
    }, [isUpdatingRole])

    const handleRoleChangeConfirm = useCallback(async (): Promise<void> => {
        if (!pendingRoleChange || isUpdatingRole) {
            return
        }

        setIsUpdatingRole(true)
        setErrorMessage(undefined)

        try {
            await updateMemberRole(
                props.projectId,
                pendingRoleChange.memberId,
                pendingRoleChange.nextRole,
                pendingRoleChange.action,
            )
            await props.onSuccess()
            props.onClose()
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Unable to update member role'))
        } finally {
            setIsUpdatingRole(false)
            setPendingRoleChange(undefined)
        }
    }, [isUpdatingRole, pendingRoleChange, props])

    return (
        <>
            {pendingRoleChange
                ? (
                    <ConfirmationModal
                        cancelText='Cancel'
                        confirmText={isUpdatingRole ? 'Updating...' : 'Confirm'}
                        message={roleChangeMessage}
                        onCancel={handleRoleChangeCancel}
                        onConfirm={handleRoleChangeConfirm}
                        title='Confirm Role Update'
                    />
                )
                : undefined}

            <div className={styles.overlay} onClick={props.onClose} role='presentation'>
                <div
                    aria-modal='true'
                    className={styles.container}
                    onClick={handleContainerClick}
                    role='dialog'
                >
                    <header className={styles.header}>
                        <h4 className={styles.title}>Add User</h4>
                    </header>

                    <FormProvider {...formMethods}>
                        <div className={styles.body}>
                            <FormUserAutocomplete
                                label='Member'
                                name='memberHandle'
                                placeholder='Search user handles'
                                required
                            />
                            <FormRadioGroup
                                label='Role'
                                name='role'
                                options={roleOptions}
                                required
                            />

                            {errorMessage
                                ? <p className={styles.errorMessage}>{errorMessage}</p>
                                : undefined}
                        </div>
                    </FormProvider>

                    <footer className={styles.footer}>
                        <Button
                            disabled={isSubmitting}
                            label='Close'
                            onClick={props.onClose}
                            secondary
                            size='lg'
                        />
                        <Button
                            disabled={!memberHandle || !selectedRole || isSubmitting}
                            label={isSubmitting ? 'Adding user...' : 'Add User'}
                            onClick={onSubmit}
                            primary
                            size='lg'
                        />
                    </footer>
                </div>
            </div>
        </>
    )
}

export default AddUserModal
