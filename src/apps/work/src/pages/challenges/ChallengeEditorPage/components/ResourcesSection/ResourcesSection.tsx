import {
    FC,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'

import { Button } from '~/libs/ui'

import {
    ConfirmationModal,
    LoadingSpinner,
    ResourceAddModal,
    ResourcesTable,
} from '../../../../../lib/components'
import { WorkAppContext } from '../../../../../lib/contexts'
import {
    useFetchResourceRoles,
    useFetchResources,
    useFetchReviews,
    useFetchSubmissions,
} from '../../../../../lib/hooks'
import {
    Challenge,
    Resource,
    ResourceRole,
    User,
    WorkAppContextModel,
} from '../../../../../lib/models'
import {
    deleteResource,
    updateResourceRoleAssignment,
} from '../../../../../lib/services'
import {
    canDeleteResource,
    LoggedInUserResource,
    showErrorToast,
    showSuccessToast,
    SortOrder,
    sortResources,
} from '../../../../../lib/utils'

import styles from './ResourcesSection.module.scss'

interface ResourceTab {
    label: string
    roleKeywords?: string[]
}

export interface ResourcesSectionProps {
    challenge: Challenge
    challengeId: string
}

const resourceTabs: ResourceTab[] = [
    {
        label: 'All',
    },
    {
        label: 'Submitters',
        roleKeywords: ['submitter'],
    },
    {
        label: 'Reviewers',
        roleKeywords: ['reviewer'],
    },
    {
        label: 'Managers/Copilots/Observers',
        roleKeywords: [
            'copilot',
            'manager',
            'observer',
        ],
    },
]

function normalizeValue(value: unknown): string {
    return typeof value === 'string'
        ? value.trim()
        : ''
}

function isReviewerResource(resource: Resource): boolean {
    const roleName = normalizeValue(resource.role || resource.roleName)
        .toLowerCase()

    return roleName.includes('reviewer')
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallbackMessage
}

function normalizeLoginUser(context: WorkAppContextModel): User | undefined {
    if (!context.loginUserInfo) {
        return undefined
    }

    const handle = context.loginUserInfo.handle
    const userId = context.loginUserInfo.userId

    if (handle === undefined && userId === undefined) {
        return undefined
    }

    return {
        handle: handle || '',
        userId: userId !== undefined
            ? String(userId)
            : '',
    }
}

/**
 * Returns whether a challenge resource belongs to the logged-in user.
 * Matches by handle or member id because the work app may receive either identity shape.
 *
 * @param resource challenge resource row being rendered
 * @param loginUser normalized logged-in user identity
 * @returns true when the resource belongs to the logged-in user
 */
function isCurrentUserResource(resource: Resource, loginUser: User): boolean {
    const resourceHandle = normalizeValue(resource.memberHandle)
        .toLowerCase()
    const resourceMemberId = normalizeValue(resource.memberId)
    const loginHandle = normalizeValue(loginUser.handle)
        .toLowerCase()
    const loginUserId = normalizeValue(loginUser.userId)

    return (!!loginHandle && resourceHandle === loginHandle)
        || (!!loginUserId && resourceMemberId === loginUserId)
}

/**
 * Returns whether the logged-in user's assigned resource roles allow resource management.
 * This mirrors the resource API behavior: admins are handled separately, copilot is always allowed,
 * and other roles need active full-read/full-write access.
 *
 * @param currentUserRoleIds role ids currently assigned to the logged-in user for this challenge
 * @param resourceRoles all resource role definitions available for the challenge
 * @returns true when the user can add, update, or delete challenge resources
 */
function canManageChallengeResources(
    currentUserRoleIds: Set<string>,
    resourceRoles: ResourceRole[],
): boolean {
    if (!currentUserRoleIds.size) {
        return false
    }

    return resourceRoles.some(role => {
        if (!currentUserRoleIds.has(role.id) || role.isActive === false) {
            return false
        }

        const normalizedRoleName = normalizeValue(role.name)
            .toLowerCase()

        return normalizedRoleName.includes('copilot')
            || (role.fullReadAccess === true && role.fullWriteAccess === true)
    })
}

// eslint-disable-next-line complexity
export const ResourcesSection: FC<ResourcesSectionProps> = (props: ResourcesSectionProps) => {
    const [resourceToDelete, setResourceToDelete] = useState<Resource | undefined>(undefined)
    const [selectedTab, setSelectedTab] = useState<number>(0)
    const [showAddModal, setShowAddModal] = useState<boolean>(false)
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
    const [sortBy, setSortBy] = useState<string>('Registration Date')
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
    const [isDeletingResource, setIsDeletingResource] = useState<boolean>(false)
    const [isUpdatingRoleResourceId, setIsUpdatingRoleResourceId] = useState<string | undefined>(undefined)

    const workAppContext = useContext(WorkAppContext)
    const resourcesResult = useFetchResources(props.challengeId)
    const resourceRolesResult = useFetchResourceRoles()
    const loginUser = normalizeLoginUser(workAppContext)

    const roleNameById = useMemo(
        () => new Map(resourceRolesResult.resourceRoles.map(role => [
            role.id,
            role.name,
        ])),
        [resourceRolesResult.resourceRoles],
    )

    const allResources = useMemo<Resource[]>(() => resourcesResult.resources.map(resource => {
        const roleName = resource.role
            || resource.roleName
            || roleNameById.get(resource.roleId)
            || ''

        return {
            challengeId: resource.challengeId,
            created: resource.created,
            email: resource.email,
            id: resource.id,
            memberHandle: resource.memberHandle,
            memberId: resource.memberId,
            rating: resource.rating,
            role: roleName,
            roleId: resource.roleId,
            roleName,
        }
    }), [resourcesResult.resources, roleNameById])

    const canEditResources = useMemo(() => {
        if (workAppContext.isAdmin) {
            return true
        }

        if (!loginUser) {
            return false
        }

        const currentUserRoleIds = new Set(allResources
            .filter(resource => isCurrentUserResource(resource, loginUser))
            .map(resource => resource.roleId)
            .filter(roleId => roleId.trim().length > 0))

        return canManageChallengeResources(
            currentUserRoleIds,
            resourceRolesResult.resourceRoles,
        )
    }, [
        allResources,
        loginUser,
        resourceRolesResult.resourceRoles,
        workAppContext.isAdmin,
    ])
    const deletionRulesChallengeId = canEditResources
        ? props.challengeId
        : undefined
    const reviewsResult = useFetchReviews(deletionRulesChallengeId)
    const submissionsResult = useFetchSubmissions(deletionRulesChallengeId, 1, 5000)

    const filteredResources = useMemo(() => {
        const tab = resourceTabs[selectedTab]

        if (!tab?.roleKeywords?.length) {
            return allResources
        }

        return allResources.filter(resource => {
            const roleName = normalizeValue(resource.role || resource.roleName)
                .toLowerCase()

            return tab.roleKeywords?.some(roleKeyword => roleName.includes(roleKeyword))
        })
    }, [allResources, selectedTab])

    const sortedResources = useMemo(
        () => sortResources(filteredResources, sortBy, sortOrder),
        [filteredResources, sortBy, sortOrder],
    )

    const loggedInUserResource = useMemo<LoggedInUserResource | undefined>(() => {
        const loginHandle = normalizeValue(workAppContext.loginUserInfo?.handle)
            .toLowerCase()
        if (!loginHandle) {
            return undefined
        }

        const userResourceRoles = allResources
            .filter(resource => normalizeValue(resource.memberHandle)
                .toLowerCase() === loginHandle)
            .map(resource => resource.role || resource.roleName || '')
            .filter(resourceRole => normalizeValue(resourceRole).length > 0)

        return {
            memberHandle: workAppContext.loginUserInfo?.handle,
            roles: userResourceRoles,
        }
    }, [allResources, workAppContext.loginUserInfo?.handle])

    const isLoadingDeletionRules = canEditResources
        && (submissionsResult.isLoading || reviewsResult.isLoading)
    const hasSubmissionDeletionRuleError = canEditResources && submissionsResult.isError
    const hasReviewDeletionRuleError = canEditResources && reviewsResult.isError

    const deletableResourceIds = useMemo(() => {
        if (!canEditResources || isLoadingDeletionRules || hasSubmissionDeletionRuleError) {
            return []
        }

        return allResources
            .filter(resource => {
                if (!hasReviewDeletionRuleError) {
                    return true
                }

                return !isReviewerResource(resource)
            })
            .filter(resource => canDeleteResource(
                resource,
                props.challenge,
                submissionsResult.submissions,
                reviewsResult.reviews,
                loggedInUserResource,
            ))
            .map(resource => resource.id)
            .filter((resourceId): resourceId is string => !!resourceId)
    }, [
        allResources,
        canEditResources,
        hasSubmissionDeletionRuleError,
        hasReviewDeletionRuleError,
        isLoadingDeletionRules,
        loggedInUserResource,
        props.challenge,
        reviewsResult.reviews,
        submissionsResult.submissions,
    ])

    const editableRoleResourceIds = useMemo(
        () => deletableResourceIds,
        [deletableResourceIds],
    )

    const handleSort = useCallback((fieldName: string): void => {
        setSortOrder(currentSortOrder => {
            if (sortBy === fieldName) {
                return currentSortOrder === 'asc'
                    ? 'desc'
                    : 'asc'
            }

            return 'desc'
        })

        setSortBy(fieldName)
    }, [sortBy])

    const handleDeleteClick = useCallback((resource: Resource): void => {
        setResourceToDelete(resource)
        setShowDeleteModal(true)
    }, [])

    const handleDeleteCancel = useCallback((): void => {
        setResourceToDelete(undefined)
        setShowDeleteModal(false)
    }, [])

    const handleDeleteConfirm = useCallback(async (): Promise<void> => {
        if (!resourceToDelete || isDeletingResource) {
            return
        }

        setIsDeletingResource(true)

        try {
            await deleteResource({
                challengeId: resourceToDelete.challengeId,
                memberHandle: resourceToDelete.memberHandle,
                memberId: resourceToDelete.memberId,
                roleId: resourceToDelete.roleId,
            })

            await resourcesResult.mutate()

            showSuccessToast('Resource deleted successfully')
            handleDeleteCancel()
        } catch (error) {
            showErrorToast(getErrorMessage(error, 'Failed to delete resource'))
        } finally {
            setIsDeletingResource(false)
        }
    }, [
        handleDeleteCancel,
        isDeletingResource,
        resourceToDelete,
        resourcesResult,
    ])

    const handleRoleUpdate = useCallback(async (
        resource: Resource,
        nextRoleId: string,
    ): Promise<void> => {
        if (isUpdatingRoleResourceId || !resource.id || !nextRoleId || nextRoleId === resource.roleId) {
            return
        }

        setIsUpdatingRoleResourceId(resource.id)

        try {
            await updateResourceRoleAssignment({
                challengeId: resource.challengeId,
                currentRoleId: resource.roleId,
                memberHandle: resource.memberHandle,
                memberId: resource.memberId,
                newRoleId: nextRoleId,
            })

            await resourcesResult.mutate()
            showSuccessToast('Resource role updated successfully')
        } catch (error) {
            showErrorToast(getErrorMessage(error, 'Failed to update resource role'))
        } finally {
            setIsUpdatingRoleResourceId(undefined)
        }
    }, [isUpdatingRoleResourceId, resourcesResult])

    const handleRoleUpdateClick = useCallback((resource: Resource, nextRoleId: string): void => {
        handleRoleUpdate(resource, nextRoleId)
            .catch(() => undefined)
    }, [handleRoleUpdate])

    const handleAddSuccess = useCallback(async (): Promise<void> => {
        await resourcesResult.mutate()
        showSuccessToast('Resource added successfully')
    }, [resourcesResult])
    const handleAddModalClose = useCallback((): void => {
        setShowAddModal(false)
    }, [])
    const handleAddModalOpen = useCallback((): void => {
        setShowAddModal(true)
    }, [])
    const handleDeleteConfirmClick = useCallback((): void => {
        handleDeleteConfirm()
            .catch(() => undefined)
    }, [handleDeleteConfirm])
    const tabClickHandlers = useMemo(
        () => resourceTabs.map((_, tabIndex) => (): void => {
            setSelectedTab(tabIndex)
        }),
        [],
    )

    const deleteResourceHandle = resourceToDelete?.memberHandle || 'this member'
    const deleteConfirmationMessage = `Are you sure you want to remove ${deleteResourceHandle}`
        + ' from this challenge?'

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.tabs} role='tablist'>
                    {resourceTabs.map((tab, tabIndex) => (
                        <button
                            aria-selected={selectedTab === tabIndex}
                            className={classNames(styles.tabButton, {
                                [styles.activeTab]: selectedTab === tabIndex,
                            })}
                            key={tab.label}
                            onClick={tabClickHandlers[tabIndex]}
                            role='tab'
                            type='button'
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {canEditResources
                    ? (
                        <Button
                            label='Add Resource'
                            onClick={handleAddModalOpen}
                            primary
                            size='lg'
                        />
                    )
                    : undefined}
            </div>

            {resourcesResult.isLoading
                ? (
                    <div className={styles.loadingState}>
                        <LoadingSpinner />
                    </div>
                )
                : undefined}

            {!resourcesResult.isLoading
                ? (
                    <>
                        <ResourcesTable
                            canEdit={canEditResources}
                            deletableResourceIds={deletableResourceIds}
                            editableRoleResourceIds={editableRoleResourceIds}
                            isLoadingDeletionRules={isLoadingDeletionRules}
                            isUpdatingRoleResourceId={isUpdatingRoleResourceId}
                            onDelete={handleDeleteClick}
                            onSort={handleSort}
                            onUpdateRole={handleRoleUpdateClick}
                            resourceRoles={resourceRolesResult.resourceRoles}
                            resources={sortedResources}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                        />
                        {hasSubmissionDeletionRuleError
                            ? (
                                <p className={styles.warningText}>
                                    Submissions could not be loaded.
                                    {' '}
                                    Resource deletion is disabled until submissions data is available.
                                </p>
                            )
                            : undefined}
                        {hasReviewDeletionRuleError
                            ? (
                                <p className={styles.warningText}>
                                    Reviews could not be loaded.
                                    {' '}
                                    Reviewer deletion is disabled until reviews data is available.
                                </p>
                            )
                            : undefined}
                    </>
                )
                : undefined}

            {showAddModal
                ? (
                    <ResourceAddModal
                        challengeId={props.challengeId}
                        onClose={handleAddModalClose}
                        onSuccess={handleAddSuccess}
                        resourceRoles={resourceRolesResult.resourceRoles}
                    />
                )
                : undefined}

            {showDeleteModal && resourceToDelete
                ? (
                    <ConfirmationModal
                        confirmText={isDeletingResource ? 'Deleting...' : 'Delete'}
                        message={deleteConfirmationMessage}
                        onCancel={handleDeleteCancel}
                        onConfirm={handleDeleteConfirmClick}
                        title='Delete Resource'
                    />
                )
                : undefined}
        </div>
    )
}

export default ResourcesSection
