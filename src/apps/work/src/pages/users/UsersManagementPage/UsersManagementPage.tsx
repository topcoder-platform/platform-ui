/* eslint-disable complexity */

import {
    FC,
    useCallback,
    useContext,
    useState,
} from 'react'
import { Link, useParams } from 'react-router-dom'

import { PageWrapper } from '~/apps/review/src/lib'
import {
    Button,
    IconOutline,
} from '~/libs/ui'

import {
    AddUserModal,
    InviteUserModal,
    LoadingSpinner,
    ProjectListTabs,
    ProjectStatus,
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
    ProjectStatusValue,
    WorkAppContextModel,
} from '../../../lib/models'
import {
    deleteProjectMemberInvite,
    removeMemberFromProject,
} from '../../../lib/services'
import {
    checkCanManageProject,
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

interface RenderProjectTitleActionParams {
    canManageProject: boolean
    projectId: string | undefined
    projectStatus: ProjectStatusValue | undefined
}

function renderProjectTitleAction(params: RenderProjectTitleActionParams): JSX.Element | undefined {
    if (!params.projectId) {
        return undefined
    }

    return (
        <div className={styles.projectTitleActions}>
            {params.projectStatus
                ? <ProjectStatus status={params.projectStatus} />
                : undefined}
            {params.canManageProject
                ? (
                    <Link
                        aria-label='Edit project'
                        className={styles.projectEditLink}
                        to={`/projects/${params.projectId}/edit`}
                    >
                        <IconOutline.PencilIcon className={styles.projectEditIcon} />
                    </Link>
                )
                : undefined}
        </div>
    )
}

export const UsersManagementPage: FC = () => {
    const {
        projectId: projectIdFromRoute,
    }: Readonly<{
        projectId?: string
    }> = useParams<'projectId'>()
    const projectId = toOptionalString(projectIdFromRoute) || ''

    const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false)
    const [showInviteUserModal, setShowInviteUserModal] = useState<boolean>(false)

    const {
        loginUserInfo,
        userRoles,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const projectResult = useFetchProject(projectId || undefined)
    const projectMembersResult = useFetchProjectMembers(projectId || undefined)
    const projectMembersError: Error | undefined = projectMembersResult.error
    const declinedInvites: ProjectInvite[] = projectMembersResult.declinedInvites
    const invites: ProjectInvite[] = projectMembersResult.invites
    const isProjectMembersLoading: boolean = projectMembersResult.isLoading
    const members: ProjectMember[] = projectMembersResult.members
    const mutateProjectMembers = projectMembersResult.mutate

    const selectedProjectName = toOptionalString(projectResult.project?.name)
    const pageTitle = selectedProjectName || 'Project users'
    const canManageProject = !!projectResult.project
        && checkCanManageProject(
            userRoles,
            loginUserInfo?.userId,
            projectResult.project,
        )
    const canManageMembers = canManageProject

    const hasMembers = members.length > 0
    const hasDeclinedInvites = declinedInvites.length > 0
    const hasInvites = invites.length > 0
    const isLoading = projectResult.isLoading || isProjectMembersLoading

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
    const titleAction = renderProjectTitleAction({
        canManageProject,
        projectId,
        projectStatus: projectResult.project?.status,
    })
    const rightHeader = canManageMembers && projectId
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
        : undefined

    return (
        <PageWrapper
            breadCrumb={[]}
            pageTitle={pageTitle}
            rightHeader={rightHeader}
            titleAction={titleAction}
        >
            {projectId
                ? <ProjectListTabs projectId={projectId} />
                : undefined}

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

            {projectId && !isLoading && !projectResult.error && !projectMembersError
                && !hasMembers && !hasInvites && !hasDeclinedInvites
                ? (
                    <div className={styles.emptyState}>
                        No project members yet for
                        {' '}
                        {selectedProjectName || 'the selected project'}
                        .
                    </div>
                )
                : undefined}

            {projectId && !isLoading && !projectResult.error && !projectMembersError
                && (hasMembers || hasInvites || hasDeclinedInvites)
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

                        {hasDeclinedInvites
                            ? (
                                <div className={styles.tableSection}>
                                    <h4 className={styles.sectionTitle}>Declined Invitations</h4>
                                    <div className={`${styles.tableHeader} ${styles.invitesTableHeader}`}>
                                        <div>User</div>
                                        <div className={styles.headerAction}>Actions</div>
                                    </div>
                                    <div className={styles.tableBody}>
                                        {declinedInvites.map(invite => (
                                            <UserCard
                                                compactInviteView
                                                isEditable={canManageMembers}
                                                isInvite
                                                key={`declined-invite-${invite.id || invite.email || invite.userId}`}
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

            {showAddUserModal && projectId && canManageMembers
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

            {showInviteUserModal && projectId && canManageMembers
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
        </PageWrapper>
    )
}

export default UsersManagementPage
