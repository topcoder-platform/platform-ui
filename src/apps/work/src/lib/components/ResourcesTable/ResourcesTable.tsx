import {
    ChangeEvent,
    FC,
    MouseEvent,
    useEffect,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'

import { COMMUNITY_APP_URL } from '../../constants'
import {
    Challenge,
    Resource,
    ResourceRole,
} from '../../models'
import {
    formatDate,
    getRatingLevel,
    SortOrder,
} from '../../utils'
import { LoadingSpinner } from '../LoadingSpinner'

import styles from './ResourcesTable.module.scss'

interface ResourcesTableProps {
    canEdit: boolean
    deletableResourceIds: string[]
    editableRoleResourceIds: string[]
    isLoadingDeletionRules: boolean
    isUpdatingRoleResourceId?: string
    onDelete: (resource: Resource) => void
    onUpdateRole: (resource: Resource, nextRoleId: string) => void
    onSort: (fieldName: string) => void
    resourceRoles: ResourceRole[]
    resources: Resource[]
    sortBy: string
    sortOrder: SortOrder
    track?: Challenge['track']
}

interface RoleOption {
    label: string
    value: string
}

interface ResourceRowProps {
    canEdit: boolean
    deletableResourceIdsSet: Set<string>
    editableRoleResourceIdsSet: Set<string>
    isDesignTrack: boolean
    isLoadingDeletionRules: boolean
    isUpdatingRoleResourceId?: string
    onDelete: (resource: Resource) => void
    onUpdateRole: (resource: Resource, nextRoleId: string) => void
    permissionLabelByRoleId: Map<string, string>
    roleOptions: RoleOption[]
    resource: Resource
}

interface ResourceActionsCellProps {
    canDelete: boolean
    canEditRole: boolean
    hasRoleChanged: boolean
    isLoadingDeletionRules: boolean
    isUpdatingRole: boolean
    nextRoleId: string
    onDeleteClick: () => void
    onRoleChange: (event: ChangeEvent<HTMLSelectElement>) => void
    onUpdateRoleClick: () => void
    roleOptions: RoleOption[]
}

interface ResourceHandleCellProps {
    handle: string
    profileUrl?: string
    ratingLevel: string
}

function getSortIndicator(
    fieldName: string,
    sortBy: string,
    sortOrder: SortOrder,
): string {
    if (fieldName !== sortBy) {
        return ''
    }

    return sortOrder === 'asc'
        ? ' \u2191'
        : ' \u2193'
}

function normalizeTrack(track: Challenge['track'] | undefined): string {
    if (typeof track === 'string') {
        return track
    }

    if (!track || typeof track !== 'object') {
        return ''
    }

    return String(track.track || track.name || track.abbreviation || '')
}

function getRolePermissionSummary(role: ResourceRole): string {
    const readPermission = role.fullReadAccess === true
        ? 'Full read'
        : 'Limited read'
    const writePermission = role.fullWriteAccess === true
        ? 'Full write'
        : 'Limited write'

    return `${readPermission}, ${writePermission}`
}

function canManageResource(
    deletableResourceIdsSet: Set<string>,
    isLoadingDeletionRules: boolean,
    resourceId: string | undefined,
): boolean {
    if (isLoadingDeletionRules || !resourceId) {
        return false
    }

    return deletableResourceIdsSet.has(resourceId)
}

function isRoleUpdateInProgress(
    resourceId: string | undefined,
    updatingResourceId: string | undefined,
): boolean {
    return !!resourceId && resourceId === updatingResourceId
}

function hasRoleChanged(nextRoleId: string, currentRoleId: string): boolean {
    return !!nextRoleId && nextRoleId !== currentRoleId
}

const ResourceHandleCell: FC<ResourceHandleCellProps> = (
    props: ResourceHandleCellProps,
) => {
    if (!props.profileUrl) {
        return <td>{props.handle}</td>
    }

    return (
        <td>
            <a
                className={classNames(
                    styles.handleLink,
                    styles[props.ratingLevel],
                )}
                href={props.profileUrl}
                rel='noreferrer'
                target='_blank'
            >
                {props.handle}
            </a>
        </td>
    )
}

const ResourceActionsCell: FC<ResourceActionsCellProps> = (
    props: ResourceActionsCellProps,
) => (
    <td className={styles.actionsCell}>
        {props.isLoadingDeletionRules
            ? (
                <span className={styles.actionLoading}>
                    <LoadingSpinner size='sm' />
                </span>
            )
            : undefined}

        {props.canEditRole
            ? (
                <div className={styles.roleEditor}>
                    <select
                        className={styles.roleSelect}
                        disabled={props.isUpdatingRole || props.roleOptions.length === 0}
                        onChange={props.onRoleChange}
                        value={props.nextRoleId}
                    >
                        {props.roleOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button
                        className={styles.updateButton}
                        disabled={!props.hasRoleChanged || props.isUpdatingRole}
                        onClick={props.onUpdateRoleClick}
                        type='button'
                    >
                        {props.isUpdatingRole ? 'Saving...' : 'Save'}
                    </button>
                </div>
            )
            : undefined}

        {props.canDelete
            ? (
                <button
                    className={styles.deleteButton}
                    onClick={props.onDeleteClick}
                    type='button'
                >
                    Delete
                </button>
            )
            : undefined}
    </td>
)

const ResourceRow: FC<ResourceRowProps> = (props: ResourceRowProps) => {
    const [nextRoleId, setNextRoleId] = useState<string>(props.resource.roleId)

    useEffect(() => {
        setNextRoleId(props.resource.roleId)
    }, [props.resource.roleId])

    function handleDeleteClick(): void {
        props.onDelete(props.resource)
    }

    function handleRoleChange(event: ChangeEvent<HTMLSelectElement>): void {
        setNextRoleId(event.currentTarget.value)
    }

    function handleUpdateRoleClick(): void {
        props.onUpdateRole(props.resource, nextRoleId)
    }

    const handle = props.resource.memberHandle || '-'
    const ratingLevel = getRatingLevel(props.resource.rating || 0)
    const role = props.resource.role || props.resource.roleName || '-'
    const permissions = props.permissionLabelByRoleId.get(props.resource.roleId) || '-'
    const profileUrl = props.resource.memberHandle
        ? `${COMMUNITY_APP_URL}/members/${encodeURIComponent(props.resource.memberHandle)}`
        : undefined
    const canDelete = canManageResource(
        props.deletableResourceIdsSet,
        props.isLoadingDeletionRules,
        props.resource.id,
    )
    const canEditRole = canManageResource(
        props.editableRoleResourceIdsSet,
        props.isLoadingDeletionRules,
        props.resource.id,
    )
    const isUpdatingRole = isRoleUpdateInProgress(
        props.resource.id,
        props.isUpdatingRoleResourceId,
    )
    const roleHasChanged = hasRoleChanged(nextRoleId, props.resource.roleId)

    return (
        <tr>
            {!props.isDesignTrack
                ? <td>{role}</td>
                : undefined}
            <ResourceHandleCell
                handle={handle}
                profileUrl={profileUrl}
                ratingLevel={ratingLevel}
            />
            <td>{props.resource.email || '-'}</td>
            <td>{formatDate(props.resource.created)}</td>
            <td>{permissions}</td>
            {props.canEdit
                ? (
                    <ResourceActionsCell
                        canDelete={canDelete}
                        canEditRole={canEditRole}
                        hasRoleChanged={roleHasChanged}
                        isLoadingDeletionRules={props.isLoadingDeletionRules}
                        isUpdatingRole={isUpdatingRole}
                        nextRoleId={nextRoleId}
                        onDeleteClick={handleDeleteClick}
                        onRoleChange={handleRoleChange}
                        onUpdateRoleClick={handleUpdateRoleClick}
                        roleOptions={props.roleOptions}
                    />
                )
                : undefined}
        </tr>
    )
}

export const ResourcesTable: FC<ResourcesTableProps> = (props: ResourcesTableProps) => {
    const deletableResourceIdsSet = new Set(props.deletableResourceIds)
    const editableRoleResourceIdsSet = new Set(props.editableRoleResourceIds)
    const roleOptions = useMemo<RoleOption[]>(() => props.resourceRoles
        .map(role => ({
            label: `${role.name} (${getRolePermissionSummary(role)})`,
            value: role.id,
        }))
        .filter(roleOption => roleOption.label.trim() && roleOption.value.trim())
        .sort((optionA, optionB) => optionA.label.localeCompare(optionB.label)), [props.resourceRoles])
    const permissionLabelByRoleId = useMemo(
        () => new Map(props.resourceRoles.map(role => [
            role.id,
            getRolePermissionSummary(role),
        ])),
        [props.resourceRoles],
    )
    const isDesignTrack = normalizeTrack(props.track)
        .toLowerCase() === 'design'
    const tableColumnCount = (isDesignTrack ? 0 : 1)
        + 4
        + (props.canEdit ? 1 : 0)

    function handleSortButtonClick(event: MouseEvent<HTMLButtonElement>): void {
        const fieldName = event.currentTarget.dataset.fieldName
        if (!fieldName) {
            return
        }

        props.onSort(fieldName)
    }

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {!isDesignTrack
                            ? (
                                <th>
                                    <button
                                        type='button'
                                        className={styles.sortButton}
                                        data-field-name='Role'
                                        onClick={handleSortButtonClick}
                                    >
                                        Role
                                        {getSortIndicator('Role', props.sortBy, props.sortOrder)}
                                    </button>
                                </th>
                            )
                            : undefined}
                        <th>
                            <button
                                type='button'
                                className={styles.sortButton}
                                data-field-name='Handle'
                                onClick={handleSortButtonClick}
                            >
                                Handle
                                {getSortIndicator('Handle', props.sortBy, props.sortOrder)}
                            </button>
                        </th>
                        <th>
                            <button
                                type='button'
                                className={styles.sortButton}
                                data-field-name='Email'
                                onClick={handleSortButtonClick}
                            >
                                Email
                                {getSortIndicator('Email', props.sortBy, props.sortOrder)}
                            </button>
                        </th>
                        <th>
                            <button
                                type='button'
                                className={styles.sortButton}
                                data-field-name='Registration Date'
                                onClick={handleSortButtonClick}
                            >
                                Registration Date
                                {getSortIndicator('Registration Date', props.sortBy, props.sortOrder)}
                            </button>
                        </th>
                        <th>Permissions</th>
                        {props.canEdit
                            ? <th>Actions</th>
                            : undefined}
                    </tr>
                </thead>
                <tbody>
                    {props.resources.length === 0
                        ? (
                            <tr>
                                <td className={styles.emptyRow} colSpan={tableColumnCount}>
                                    No resources found.
                                </td>
                            </tr>
                        )
                        : undefined}

                    {props.resources.map(resource => (
                        <ResourceRow
                            canEdit={props.canEdit}
                            deletableResourceIdsSet={deletableResourceIdsSet}
                            editableRoleResourceIdsSet={editableRoleResourceIdsSet}
                            isDesignTrack={isDesignTrack}
                            isLoadingDeletionRules={props.isLoadingDeletionRules}
                            isUpdatingRoleResourceId={props.isUpdatingRoleResourceId}
                            key={resource.id || `${resource.roleId}-${resource.memberHandle}`}
                            onDelete={props.onDelete}
                            onUpdateRole={props.onUpdateRole}
                            permissionLabelByRoleId={permissionLabelByRoleId}
                            roleOptions={roleOptions}
                            resource={resource}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default ResourcesTable
