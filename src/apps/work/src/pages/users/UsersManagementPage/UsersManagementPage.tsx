/* eslint-disable complexity */

import {
    FC,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'

import { Button, PageTitle } from '~/libs/ui'

import {
    AddUserModal,
    InviteUserModal,
    LoadingSpinner,
    NullLayout,
    UserCard,
} from '../../../lib/components'
import {
    FormSelectField,
    FormSelectOption,
} from '../../../lib/components/form'
import { WorkAppContext } from '../../../lib/contexts'
import {
    useFetchProjectMembers,
    UseFetchProjectMembersResult,
    useFetchUserProjects,
    UseFetchUserProjectsResult,
} from '../../../lib/hooks'
import {
    ProjectInvite,
    ProjectMember,
    WorkAppContextModel,
} from '../../../lib/models'
import {
    deleteProjectMemberInvite,
    ProjectSummary,
    removeMemberFromProject,
} from '../../../lib/services'
import {
    checkIsCopilotOrManager,
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'

import styles from './UsersManagementPage.module.scss'

interface UsersPageFormData {
    projectId: string
}

function getLocationStateProjectId(locationState: unknown): string | undefined {
    if (typeof locationState !== 'object' || !locationState || !('projectId' in locationState)) {
        return undefined
    }

    const projectId = (locationState as {
        projectId?: unknown
    }).projectId

    if (projectId === undefined || projectId === null) {
        return undefined
    }

    const normalizedProjectId = String(projectId)
        .trim()

    return normalizedProjectId || undefined
}

function getLocationStateProjectName(locationState: unknown): string | undefined {
    if (typeof locationState !== 'object' || !locationState || !('projectName' in locationState)) {
        return undefined
    }

    const projectName = (locationState as {
        projectName?: unknown
    }).projectName

    if (typeof projectName !== 'string') {
        return undefined
    }

    const normalizedProjectName = projectName.trim()

    return normalizedProjectName || undefined
}

export const UsersManagementPage: FC = () => {
    const location = useLocation()
    const locationProjectId = getLocationStateProjectId(location.state)
    const locationProjectName = getLocationStateProjectName(location.state)

    const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false)
    const [showInviteUserModal, setShowInviteUserModal] = useState<boolean>(false)

    const {
        isAdmin,
        isCopilot,
        isManager,
        loginUserInfo,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const formMethods = useForm<UsersPageFormData>({
        defaultValues: {
            projectId: locationProjectId || '',
        },
        mode: 'onChange',
    })

    const selectedProjectId = formMethods.watch('projectId')

    const userProjectsResult: UseFetchUserProjectsResult = useFetchUserProjects()
    const projectsError: Error | undefined = userProjectsResult.error
    const hasMore: boolean = userProjectsResult.hasMore
    const isProjectsLoading: boolean = userProjectsResult.isLoading
    const loadMore: () => void = userProjectsResult.loadMore
    const projects: ProjectSummary[] = userProjectsResult.projects

    const projectMembersResult: UseFetchProjectMembersResult
        = useFetchProjectMembers(selectedProjectId || undefined)
    const projectMembersError: Error | undefined = projectMembersResult.error
    const invites: ProjectInvite[] = projectMembersResult.invites
    const isProjectMembersLoading: boolean = projectMembersResult.isLoading
    const members: ProjectMember[] = projectMembersResult.members
    const mutateProjectMembers = projectMembersResult.mutate

    const projectOptions = useMemo<FormSelectOption[]>(
        () => projects
            .map(project => ({
                label: project.name,
                value: String(project.id),
            }))
            .sort((projectA, projectB) => projectA.label.localeCompare(projectB.label)),
        [projects],
    )

    const selectedProjectName = useMemo(() => {
        const selectedProject = projects.find(project => String(project.id) === selectedProjectId)

        if (selectedProject) {
            return selectedProject.name
        }

        if (locationProjectId && selectedProjectId === locationProjectId) {
            return locationProjectName
        }

        return undefined
    }, [
        locationProjectId,
        locationProjectName,
        projects,
        selectedProjectId,
    ])

    const loginHandle = loginUserInfo?.handle || ''
    const canManageMembers = (isAdmin || isCopilot || isManager)
        || checkIsCopilotOrManager(members, loginHandle)

    const hasMembers = members.length > 0
    const hasInvites = invites.length > 0

    const projectSelectorHint = useMemo(() => {
        if (isProjectsLoading) {
            return 'Loading projects...'
        }

        if (projectsError) {
            return projectsError.message
        }

        return undefined
    }, [isProjectsLoading, projectsError])

    const handleRemove = useCallback(
        async (
            user: ProjectMember | ProjectInvite,
            isInvite: boolean,
        ): Promise<void> => {
            const projectId = selectedProjectId
                || (user.projectId !== undefined && user.projectId !== null
                    ? String(user.projectId)
                    : '')
            const recordId = user.id !== undefined && user.id !== null
                ? String(user.id)
                : ''

            if (!projectId || !recordId) {
                throw new Error('Cannot remove user because project information is missing.')
            }

            try {
                if (isInvite) {
                    await deleteProjectMemberInvite(projectId, recordId)
                    showSuccessToast('Invitation removed successfully')
                } else {
                    await removeMemberFromProject(projectId, recordId)
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
        [mutateProjectMembers, selectedProjectId],
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

    const openAddUserModal = useCallback(() => {
        if (!canManageMembers || !selectedProjectId) {
            return
        }

        setShowAddUserModal(true)
    }, [canManageMembers, selectedProjectId])

    const openInviteUserModal = useCallback(() => {
        if (!canManageMembers || !selectedProjectId) {
            return
        }

        setShowInviteUserModal(true)
    }, [canManageMembers, selectedProjectId])

    const closeAddUserModal = useCallback(() => {
        setShowAddUserModal(false)
    }, [])

    const closeInviteUserModal = useCallback(() => {
        setShowInviteUserModal(false)
    }, [])

    return (
        <NullLayout>
            <PageTitle>Users</PageTitle>
            <h3 className={styles.pageHeading}>Users</h3>
            <div className={styles.selectorGrid}>
                <FormProvider {...formMethods}>
                    <FormSelectField
                        hint={projectSelectorHint}
                        label='Project'
                        name='projectId'
                        options={projectOptions}
                        placeholder='Select a project'
                    />
                </FormProvider>
                {hasMore
                    ? (
                        <div className={styles.loadMoreActions}>
                            <Button
                                disabled={isProjectsLoading}
                                label='Load More Projects'
                                onClick={loadMore}
                                secondary
                                size='lg'
                            />
                        </div>
                    )
                    : undefined}
            </div>

            <div className={styles.buttonGroup}>
                {canManageMembers && selectedProjectId
                    ? (
                        <>
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
                        </>
                    )
                    : undefined}
                {selectedProjectId
                    ? (
                        <Link className={styles.projectLink} to={`/projects/${selectedProjectId}/challenges`}>
                            <Button
                                label='Go To Project'
                                secondary
                                size='lg'
                            />
                        </Link>
                    )
                    : undefined}
            </div>

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

            {!selectedProjectId
                ? <div className={styles.emptyState}>Select a project to manage users.</div>
                : undefined}

            {selectedProjectId && isProjectMembersLoading
                ? (
                    <div className={styles.loadingWrapper}>
                        <LoadingSpinner />
                    </div>
                )
                : undefined}

            {selectedProjectId && !isProjectMembersLoading && !hasMembers && !hasInvites
                ? (
                    <div className={styles.emptyState}>
                        No project members yet for
                        {' '}
                        {selectedProjectName || 'the selected project'}
                        .
                    </div>
                )
                : undefined}

            {selectedProjectId && !isProjectMembersLoading && (hasMembers || hasInvites)
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
                                    <div className={styles.tableHeader}>
                                        <div>User</div>
                                        <div>Read</div>
                                        <div>Write</div>
                                        <div>Full Access</div>
                                        <div>Copilot</div>
                                        <div className={styles.headerAction}>Actions</div>
                                    </div>
                                    <div className={styles.tableBody}>
                                        {invites.map(invite => (
                                            <UserCard
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

            {showAddUserModal && selectedProjectId
                ? (
                    <AddUserModal
                        onClose={closeAddUserModal}
                        onSuccess={handleAddUserSuccess}
                        projectId={selectedProjectId}
                        projectMembers={members}
                        projectName={selectedProjectName}
                    />
                )
                : undefined}

            {showInviteUserModal && selectedProjectId
                ? (
                    <InviteUserModal
                        invitedMembers={invites}
                        onClose={closeInviteUserModal}
                        onSuccess={handleInviteUserSuccess}
                        projectId={selectedProjectId}
                        projectMembers={members}
                    />
                )
                : undefined}
        </NullLayout>
    )
}

export default UsersManagementPage
