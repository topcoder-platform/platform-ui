import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'

import { Button } from '~/libs/ui'

import { PROJECT_ROLES } from '../../constants/project-roles.constants'
import {
    ProjectInvite,
    ProjectMember,
} from '../../models'
import { updateMemberRole } from '../../services'
import { ConfirmationModal } from '../ConfirmationModal'
import { LoadingSpinner } from '../LoadingSpinner'

import styles from './UserCard.module.scss'

type UserCardData = ProjectInvite | ProjectMember

export interface UserCardProps {
    user: UserCardData
    isEditable?: boolean
    isInvite?: boolean
    onRemove: (user: UserCardData, isInvite: boolean) => Promise<void> | void
    onRoleUpdate?: (member: ProjectMember) => Promise<void> | void
}

interface RoleOption {
    key: string
    label: string
    value: string
}

const ROLE_OPTIONS: RoleOption[] = [
    {
        key: 'read',
        label: 'Read',
        value: PROJECT_ROLES.READ,
    },
    {
        key: 'write',
        label: 'Write',
        value: PROJECT_ROLES.WRITE,
    },
    {
        key: 'manager',
        label: 'Full Access',
        value: PROJECT_ROLES.MANAGER,
    },
    {
        key: 'copilot',
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

function formatInviteDate(value?: string): string {
    if (!value) {
        return 'Invited recently'
    }

    const dateValue = new Date(value)

    if (Number.isNaN(dateValue.getTime())) {
        return 'Invited recently'
    }

    return `Invited ${dateValue.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })}`
}

export const UserCard: FC<UserCardProps> = (props: UserCardProps) => {
    const isEditable = props.isEditable === true
    const isInvite = props.isInvite === true
    const [isRemoving, setIsRemoving] = useState<boolean>(false)
    const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false)
    const [showRemoveConfirmation, setShowRemoveConfirmation] = useState<boolean>(false)
    const [showRoleUpdatedConfirmation, setShowRoleUpdatedConfirmation] = useState<boolean>(false)
    const [statusError, setStatusError] = useState<string | undefined>(undefined)

    const userName = useMemo(
        () => props.user.handle || props.user.email || 'Unknown user',
        [props.user.email, props.user.handle],
    )
    const userRecordId = props.user.id !== undefined && props.user.id !== null
        ? String(props.user.id)
        : (props.user.userId !== undefined && props.user.userId !== null
            ? String(props.user.userId)
            : 'unknown')

    const closeStatusModal = useCallback(() => {
        setStatusError(undefined)
        setShowRoleUpdatedConfirmation(false)
    }, [])

    // eslint-disable-next-line complexity
    const handleRoleUpdate = useCallback(async (nextRole: string): Promise<void> => {
        if (isUpdatingRole || isInvite || !isEditable) {
            return
        }

        const currentRole = typeof props.user.role === 'string'
            ? props.user.role.trim()
            : ''

        if (!nextRole.trim() || currentRole === nextRole) {
            return
        }

        const projectId = props.user.projectId !== undefined && props.user.projectId !== null
            ? String(props.user.projectId)
            : ''
        const memberId = props.user.id !== undefined && props.user.id !== null
            ? String(props.user.id)
            : ''

        if (!projectId || !memberId) {
            setStatusError('Project member information is incomplete.')
            return
        }

        setStatusError(undefined)
        setIsUpdatingRole(true)

        try {
            const action = currentRole === PROJECT_ROLES.MANAGER && nextRole === PROJECT_ROLES.COPILOT
                ? 'complete-copilot-requests'
                : undefined
            const updatedMember = await updateMemberRole(projectId, memberId, nextRole, action)

            await props.onRoleUpdate?.(updatedMember)
            setShowRoleUpdatedConfirmation(true)
        } catch (error) {
            setStatusError(getErrorMessage(error, 'Unable to update user role'))
        } finally {
            setIsUpdatingRole(false)
        }
    }, [isEditable, isInvite, isUpdatingRole, props])

    const roleChangeHandlers: Record<string, () => void> = useMemo(
        () => ROLE_OPTIONS.reduce((accumulator: Record<string, () => void>, option) => {
            accumulator[option.value] = (): void => {
                handleRoleUpdate(option.value)
            }

            return accumulator
        }, {}),
        [handleRoleUpdate],
    )

    const handleRemoveRequest = useCallback(() => {
        setShowRemoveConfirmation(true)
    }, [])

    const handleRemoveCancel = useCallback(() => {
        if (isRemoving) {
            return
        }

        setShowRemoveConfirmation(false)
    }, [isRemoving])

    const handleRemoveConfirm = useCallback(async (): Promise<void> => {
        if (isRemoving) {
            return
        }

        setIsRemoving(true)
        setStatusError(undefined)

        try {
            await props.onRemove(props.user, isInvite)
            setShowRemoveConfirmation(false)
        } catch (error) {
            setStatusError(getErrorMessage(error, 'Unable to remove user from project'))
        } finally {
            setIsRemoving(false)
        }
    }, [isInvite, isRemoving, props])

    return (
        <>
            {isUpdatingRole
                ? (
                    <div className={styles.statusOverlay}>
                        <div className={styles.statusModal}>
                            <LoadingSpinner />
                            <p className={styles.statusText}>Updating permission...</p>
                        </div>
                    </div>
                )
                : undefined}

            {showRoleUpdatedConfirmation
                ? (
                    <ConfirmationModal
                        cancelText='OK'
                        confirmText='OK'
                        message='The member role has been updated successfully.'
                        onCancel={closeStatusModal}
                        onConfirm={closeStatusModal}
                        title='Success'
                    />
                )
                : undefined}

            {statusError
                ? (
                    <ConfirmationModal
                        cancelText='Close'
                        confirmText='Close'
                        message={statusError}
                        onCancel={closeStatusModal}
                        onConfirm={closeStatusModal}
                        title='Error'
                    />
                )
                : undefined}

            {showRemoveConfirmation
                ? (
                    <ConfirmationModal
                        cancelText='Cancel'
                        confirmText={isRemoving ? 'Removing...' : 'Remove'}
                        message={`Are you sure you want to remove ${userName} from this project?`}
                        onCancel={handleRemoveCancel}
                        onConfirm={handleRemoveConfirm}
                        title='Confirm Removal'
                    />
                )
                : undefined}

            <div className={styles.row}>
                <div className={styles.userCell}>{userName}</div>

                {isInvite
                    ? (
                        <>
                            <div className={styles.roleCell}>{formatInviteDate(props.user.createdAt)}</div>
                            <div className={styles.roleCell} />
                            <div className={styles.roleCell} />
                            <div className={styles.roleCell} />
                        </>
                    )
                    : ROLE_OPTIONS.map(option => (
                        <div className={styles.roleCell} key={`${option.key}-${userRecordId}`}>
                            <label className={styles.roleOption} htmlFor={`${option.key}-${userRecordId}`}>
                                <input
                                    checked={props.user.role === option.value}
                                    disabled={!isEditable || isUpdatingRole}
                                    id={`${option.key}-${userRecordId}`}
                                    name={`member-role-${userRecordId}`}
                                    onChange={roleChangeHandlers[option.value]}
                                    type='radio'
                                />
                                <span>{option.label}</span>
                            </label>
                        </div>
                    ))}

                <div className={styles.actionCell}>
                    {isEditable
                        ? (
                            <Button
                                disabled={isRemoving}
                                label='Remove'
                                onClick={handleRemoveRequest}
                                secondary
                                size='lg'
                            />
                        )
                        : undefined}
                </div>
            </div>
        </>
    )
}

export default UserCard
