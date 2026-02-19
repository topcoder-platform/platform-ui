/* eslint-disable complexity */

import {
    FC,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

import {
    Button,
    IconSolid,
    PageTitle,
} from '~/libs/ui'

import {
    AddUserModal,
    InviteUserModal,
    LoadingSpinner,
    NullLayout,
    UserCard,
} from '../../../lib/components'
import { WorkAppContext } from '../../../lib/contexts'
import {
    useFetchProject,
    useFetchProjectMembers,
} from '../../../lib/hooks'
import {
    ProjectInvite,
    ProjectMember,
    WorkAppContextModel,
} from '../../../lib/models'
import {
    deleteProjectMemberInvite,
    removeMemberFromProject,
} from '../../../lib/services'
import {
    checkIsCopilotOrManager,
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'

import styles from './UsersManagementPage.module.scss'

function toOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const normalizedValue = value.trim()
    return normalizedValue || undefined
}

function resolveBackToPath(locationState: unknown, projectId: string): string {
    const fallbackPath = projectId
        ? `/projects/${projectId}/challenges`
        : '/projects'

    if (typeof locationState !== 'object' || !locationState || !('backTo' in locationState)) {
        return fallbackPath
    }

    const backTo = toOptionalString((locationState as {
        backTo?: unknown
    }).backTo)

    if (!backTo || !projectId) {
        return fallbackPath
    }

    return backTo.startsWith(`/projects/${projectId}/`)
        ? backTo
        : fallbackPath
}

export const UsersManagementPage: FC = () => {
    const location = useLocation()
    const {
        projectId: projectIdFromRoute,
    }: Readonly<{
        projectId?: string
    }> = useParams<'projectId'>()
    const projectId = toOptionalString(projectIdFromRoute) || ''

    const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false)
    const [showInviteUserModal, setShowInviteUserModal] = useState<boolean>(false)

    const {
        isAdmin,
        isCopilot,
        isManager,
        loginUserInfo,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const projectResult = useFetchProject(projectId || undefined)
    const projectMembersResult = useFetchProjectMembers(projectId || undefined)
    const projectMembersError: Error | undefined = projectMembersResult.error
    const invites: ProjectInvite[] = projectMembersResult.invites
    const isProjectMembersLoading: boolean = projectMembersResult.isLoading
    const members: ProjectMember[] = projectMembersResult.members
    const mutateProjectMembers = projectMembersResult.mutate

    const selectedProjectName = toOptionalString(projectResult.project?.name)
    const pageHeading = selectedProjectName
        ? `${selectedProjectName} users`
        : 'Project users'
    const loginHandle = loginUserInfo?.handle || ''
    const canManageMembers = (isAdmin || isCopilot || isManager)
        || checkIsCopilotOrManager(members, loginHandle)

    const hasMembers = members.length > 0
    const hasInvites = invites.length > 0
    const isLoading = projectResult.isLoading || isProjectMembersLoading

    const backToPath = useMemo(
        () => resolveBackToPath(location.state, projectId),
        [location.state, projectId],
    )

    const handleRemove = useCallback(
        async (
            user: ProjectMember | ProjectInvite,
            isInvite: boolean,
        ): Promise<void> => {
            const targetProjectId = projectId
                || (user.projectId !== undefined && user.projectId !== null
                    ? String(user.projectId)
                    : '')
            const recordId = user.id !== undefined && user.id !== null
                ? String(user.id)
                : ''

            if (!targetProjectId || !recordId) {
                throw new Error('Cannot remove user because project information is missing.')
            }

            try {
                if (isInvite) {
                    await deleteProjectMemberInvite(targetProjectId, recordId)
                    showSuccessToast('Invitation removed successfully')
                } else {
                    await removeMemberFromProject(targetProjectId, recordId)
                    showSuccessToast('Member removed successfully')
                }

                await mutateProjectMembers()
            } catch (error) {
                showErrorToast(error instanceof Error
                    ? error.message
                    : 'Failed to remove project user')
                throw error
            }
        },
        [mutateProjectMembers, projectId],
    )

    const handleRoleUpdated = useCallback(async (): Promise<void> => {
        showSuccessToast('Member role updated successfully')
        await mutateProjectMembers()
    }, [mutateProjectMembers])

    const handleAddUserSuccess = useCallback(async (): Promise<void> => {
        showSuccessToast('Project user access updated successfully')
        await mutateProjectMembers()
    }, [mutateProjectMembers])

    const handleInviteUserSuccess = useCallback(async (): Promise<void> => {
        showSuccessToast('User invited successfully')
        await mutateProjectMembers()
    }, [mutateProjectMembers])

    const handleRefreshMembers = useCallback(() => {
        mutateProjectMembers()
            .catch(error => {
                showErrorToast(error instanceof Error
                    ? error.message
                    : 'Failed to refresh members')
            })
    }, [mutateProjectMembers])

    const handleRefreshProject = useCallback(() => {
        projectResult.mutate()
            .catch(error => {
                showErrorToast(error instanceof Error
                    ? error.message
                    : 'Failed to refresh project')
            })
    }, [projectResult])

    const openAddUserModal = useCallback(() => {
        if (!canManageMembers || !projectId) {
            return
        }

        setShowAddUserModal(true)
    }, [canManageMembers, projectId])

    const openInviteUserModal = useCallback(() => {
        if (!canManageMembers || !projectId) {
            return
        }

        setShowInviteUserModal(true)
    }, [canManageMembers, projectId])

    const closeAddUserModal = useCallback(() => {
        setShowAddUserModal(false)
    }, [])

    const closeInviteUserModal = useCallback(() => {
        setShowInviteUserModal(false)
    }, [])

    return (
        <NullLayout>
            <PageTitle>{pageHeading}</PageTitle>
            <div className={styles.pageHeadingRow}>
                <div className={styles.pageHeadingMain}>
                    {projectId
                        ? (
                            <Link
                                aria-label='Go back'
                                className={styles.backArrowLink}
                                to={backToPath}
                            >
                                <IconSolid.ArrowLeftIcon className={styles.backArrowIcon} />
                            </Link>
                        )
                        : undefined}
                    <h3 className={styles.pageHeading}>{pageHeading}</h3>
                </div>
                {canManageMembers && projectId
                    ? (
                        <div className={styles.buttonGroup}>
                            <Button
                                label='Add User'
                                onClick={openAddUserModal}
                                primary
                                size='lg'
                            />
                            <Button
                                label='Invite User'
                                onClick={openInviteUserModal}
                                primary
                                size='lg'
                            />
                        </div>
                    )
                    : undefined}
            </div>

            {projectResult.error
                ? (
                    <div className={styles.errorBanner}>
                        <span>{projectResult.error.message}</span>
                        <Button
                            label='Retry'
                            onClick={handleRefreshProject}
                            secondary
                            size='lg'
                        />
                    </div>
                )
                : undefined}

            {projectMembersError
                ? (
                    <div className={styles.errorBanner}>
                        <span>{projectMembersError.message}</span>
                        <Button
                            label='Retry'
                            onClick={handleRefreshMembers}
                            secondary
                            size='lg'
                        />
                    </div>
                )
                : undefined}

            {!projectId
                ? <div className={styles.emptyState}>Project id is required.</div>
                : undefined}

            {projectId && isLoading
                ? (
                    <div className={styles.loadingWrapper}>
                        <LoadingSpinner />
                    </div>
                )
                : undefined}

            {projectId && !isLoading && !projectResult.error && !projectMembersError && !hasMembers && !hasInvites
                ? (
                    <div className={styles.emptyState}>
                        No project members yet for
                        {' '}
                        {selectedProjectName || 'the selected project'}
                        .
                    </div>
                )
                : undefined}

            {projectId && !isLoading && !projectResult.error && !projectMembersError && (hasMembers || hasInvites)
                ? (
                    <>
                        {hasMembers
                            ? (
                                <div className={styles.tableSection}>
                                    <div className={styles.tableHeader}>
                                        <div>User</div>
                                        <div>Read</div>
                                        <div>Write</div>
                                        <div>Full Access</div>
                                        <div>Copilot</div>
                                        <div className={styles.headerAction}>Actions</div>
                                    </div>
                                    <div className={styles.tableBody}>
                                        {members.map(member => (
                                            <UserCard
                                                isEditable={canManageMembers}
                                                key={`member-${member.id || member.userId}`}
                                                onRemove={handleRemove}
                                                onRoleUpdate={handleRoleUpdated}
                                                user={member}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                            : undefined}

                        {hasInvites
                            ? (
                                <div className={styles.tableSection}>
                                    <h4 className={styles.sectionTitle}>Invited Members</h4>
                                    <div className={`${styles.tableHeader} ${styles.invitesTableHeader}`}>
                                        <div>User</div>
                                        <div className={styles.headerAction}>Actions</div>
                                    </div>
                                    <div className={styles.tableBody}>
                                        {invites.map(invite => (
                                            <UserCard
                                                compactInviteView
                                                isEditable={canManageMembers}
                                                isInvite
                                                key={`invite-${invite.id || invite.email || invite.userId}`}
                                                onRemove={handleRemove}
                                                user={invite}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                            : undefined}
                    </>
                )
                : undefined}

            {showAddUserModal && projectId
                ? (
                    <AddUserModal
                        onClose={closeAddUserModal}
                        onSuccess={handleAddUserSuccess}
                        projectId={projectId}
                        projectMembers={members}
                        projectName={selectedProjectName}
                    />
                )
                : undefined}

            {showInviteUserModal && projectId
                ? (
                    <InviteUserModal
                        invitedMembers={invites}
                        onClose={closeInviteUserModal}
                        onSuccess={handleInviteUserSuccess}
                        projectId={projectId}
                        projectMembers={members}
                    />
                )
                : undefined}
        </NullLayout>
    )
}

export default UsersManagementPage
