/* eslint-disable complexity */
/* eslint-disable react/jsx-no-bind */

import {
    Client,
    init,
    PickerFileMetadata,
    PickerOptions,
} from 'filestack-js'
import {
    FC,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { PageWrapper } from '~/apps/review/src/lib'
import { EnvironmentConfig } from '~/config'
import {
    BaseModal,
    Button,
    IconOutline,
} from '~/libs/ui'

import {
    ATTACHMENT_TYPE_FILE,
    ATTACHMENT_TYPE_LINK,
    FILE_PICKER_SUBMISSION_CONTAINER_NAME,
    PROJECT_ATTACHMENTS_FOLDER,
} from '../../../lib/constants'
import {
    ConfirmationModal,
    ErrorMessage,
    LoadingSpinner,
    ProjectBillingAccountExpiredNotice,
    ProjectListTabs,
} from '../../../lib/components'
import {
    WorkAppContext,
} from '../../../lib/contexts'
import {
    useFetchProject,
    useFetchProjectAttachments,
    useFetchProjectMembers,
} from '../../../lib/hooks'
import {
    ProjectAttachment,
    ProjectMember,
    WorkAppContextModel,
} from '../../../lib/models'
import {
    addProjectAttachment,
    fetchProjectAttachment,
    removeProjectAttachment,
    updateProjectAttachment,
} from '../../../lib/services'

import styles from './ProjectAssetsPage.module.scss'

type AssetsTab = 'files' | 'links'
type ShareMode = 'all' | 'selected'

const ASSETS_FILE_PICKER_FROM_SOURCES = ['local_file_system']
const ASSETS_FILE_PICKER_MAX_FILES = 4
const FILE_PICKER_ACCEPT = [
    '.bmp',
    '.gif',
    '.jpg',
    '.tex',
    '.xls',
    '.xlsx',
    '.doc',
    '.docx',
    '.zip',
    '.txt',
    '.pdf',
    '.png',
    '.ppt',
    '.pptx',
    '.rtf',
    '.csv',
]

function toOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmedValue = value.trim()
    return trimmedValue || undefined
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallbackMessage
}

function getAttachmentType(attachment: ProjectAttachment): string {
    return String(attachment.type || '')
        .trim()
        .toLowerCase()
}

function getAttachmentSortValue(attachment: ProjectAttachment): number {
    const updatedAt = toOptionalString(attachment.updatedAt)
    const createdAt = toOptionalString(attachment.createdAt)
    const dateValue = updatedAt || createdAt

    if (!dateValue) {
        return 0
    }

    const parsedDate = Date.parse(dateValue)
    return Number.isNaN(parsedDate)
        ? 0
        : parsedDate
}

function getAttachmentTitle(attachment: ProjectAttachment): string {
    return toOptionalString(attachment.title)
        || toOptionalString(attachment.name)
        || toOptionalString(attachment.path)
        || 'Untitled'
}

function formatAttachmentDate(value: unknown): string {
    const normalizedValue = toOptionalString(value)

    if (!normalizedValue) {
        return '—'
    }

    const parsedDate = new Date(normalizedValue)
    if (Number.isNaN(parsedDate.getTime())) {
        return normalizedValue
    }

    return parsedDate.toLocaleString('en-US', {
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

function getFileTypeLabel(attachment: ProjectAttachment): string {
    if (getAttachmentType(attachment) === ATTACHMENT_TYPE_LINK) {
        return 'LINK'
    }

    const title = getAttachmentTitle(attachment)
    const lastDotIndex = title.lastIndexOf('.')

    if (lastDotIndex === -1 || lastDotIndex === title.length - 1) {
        return 'FILE'
    }

    return title.slice(lastDotIndex + 1)
        .toUpperCase()
}

function buildAttachmentUrl(attachment?: ProjectAttachment): string | undefined {
    if (!attachment) {
        return undefined
    }

    const attachmentUrl = toOptionalString(attachment.url)
    if (attachmentUrl) {
        return attachmentUrl
    }

    const path = toOptionalString(attachment.path)
    if (!path) {
        return undefined
    }

    if (/^https?:\/\//i.test(path)) {
        return path
    }

    const bucket = toOptionalString(attachment.s3Bucket)
    if (!bucket) {
        return undefined
    }

    const region = EnvironmentConfig.FILESTACK.REGION
        .toLowerCase()
    const baseUrl = region && region !== 'us-east-1'
        ? `https://${bucket}.s3.${region}.amazonaws.com`
        : `https://${bucket}.s3.amazonaws.com`

    return `${baseUrl}/${path}`
}

function ensureHttpProtocol(url: string): string {
    if (/^https?:\/\//i.test(url)) {
        return url
    }

    return `https://${url}`
}

function isValidUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(ensureHttpProtocol(url))
        if (!parsedUrl) {
            return false
        }

        return true
    } catch {
        return false
    }
}

function canEditAttachment(
    attachment: ProjectAttachment,
    currentUserHandle: string | undefined,
    currentUserId: string | undefined,
    isAdmin: boolean,
): boolean {
    if (isAdmin) {
        return true
    }

    const createdBy = attachment.createdBy === undefined || attachment.createdBy === null
        ? ''
        : String(attachment.createdBy)
            .trim()

    if (!createdBy) {
        return false
    }

    if (currentUserId && createdBy === currentUserId) {
        return true
    }

    if (currentUserHandle && createdBy.toLowerCase() === currentUserHandle.toLowerCase()) {
        return true
    }

    return false
}

function getAttachmentSharedWith(
    attachment: ProjectAttachment,
    membersById: Record<string, ProjectMember>,
): string {
    if (!Array.isArray(attachment.allowedUsers)) {
        return 'All project members'
    }

    if (!attachment.allowedUsers.length) {
        return 'Project admins only'
    }

    return attachment.allowedUsers
        .map(userId => {
            const member = membersById[String(userId)]
            return member?.handle
                || member?.email
                || String(userId)
        })
        .join(', ')
}

function getAttachmentOwner(
    attachment: ProjectAttachment,
    membersById: Record<string, ProjectMember>,
): string {
    const createdBy = attachment.createdBy === undefined || attachment.createdBy === null
        ? undefined
        : String(attachment.createdBy)
            .trim()

    if (!createdBy) {
        return '—'
    }

    const member = membersById[createdBy]
    if (member) {
        return member.handle || member.email || createdBy
    }

    return createdBy
}

function getAttachmentKey(attachment: ProjectAttachment): string {
    return toOptionalString(attachment.id)
        || `${getAttachmentType(attachment)}-${toOptionalString(attachment.path) || getAttachmentTitle(attachment)}`
}

export const ProjectAssetsPage: FC = () => {
    const {
        projectId: routeProjectId,
    }: Readonly<{
        projectId?: string
    }> = useParams<'projectId'>()
    const location = useLocation()
    const projectId = routeProjectId || ''

    const workAppContext: WorkAppContextModel = useContext(WorkAppContext)
    const currentUserId = workAppContext.loginUserInfo?.userId === undefined
        || workAppContext.loginUserInfo?.userId === null
        ? undefined
        : String(workAppContext.loginUserInfo.userId)
    const currentUserHandle = toOptionalString(workAppContext.loginUserInfo?.handle)

    const projectResult = useFetchProject(projectId || undefined)
    const projectMembersResult = useFetchProjectMembers(projectId || undefined)
    const attachmentsResult = useFetchProjectAttachments(projectId || undefined)

    const [activeTab, setActiveTab] = useState<AssetsTab>('files')
    const [isOpeningPicker, setIsOpeningPicker] = useState<boolean>(false)
    const [pendingUploadFiles, setPendingUploadFiles] = useState<PickerFileMetadata[]>([])
    const [showUploadOptionsModal, setShowUploadOptionsModal] = useState<boolean>(false)
    const [uploadShareMode, setUploadShareMode] = useState<ShareMode>('all')
    const [uploadAllowedUsers, setUploadAllowedUsers] = useState<string[]>([])
    const [isSavingUploadOptions, setIsSavingUploadOptions] = useState<boolean>(false)

    const [showLinkModal, setShowLinkModal] = useState<boolean>(false)
    const [editingLink, setEditingLink] = useState<ProjectAttachment | undefined>(undefined)
    const [linkTitle, setLinkTitle] = useState<string>('')
    const [linkPath, setLinkPath] = useState<string>('')
    const [linkError, setLinkError] = useState<string | undefined>(undefined)
    const [isSavingLink, setIsSavingLink] = useState<boolean>(false)

    const [showEditFileModal, setShowEditFileModal] = useState<boolean>(false)
    const [editingFile, setEditingFile] = useState<ProjectAttachment | undefined>(undefined)
    const [fileTitle, setFileTitle] = useState<string>('')
    const [fileAllowedUsers, setFileAllowedUsers] = useState<string[]>([])
    const [fileError, setFileError] = useState<string | undefined>(undefined)
    const [isSavingFile, setIsSavingFile] = useState<boolean>(false)

    const [attachmentToDelete, setAttachmentToDelete] = useState<ProjectAttachment | undefined>(undefined)
    const [isDeletingAttachment, setIsDeletingAttachment] = useState<boolean>(false)
    const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | undefined>(undefined)

    const filestackClient = useMemo<Client | undefined>(() => {
        const apiKey = EnvironmentConfig.FILESTACK.API_KEY
        if (!apiKey) {
            return undefined
        }

        return init(apiKey, {
            cname: EnvironmentConfig.FILESTACK.CNAME,
            security: EnvironmentConfig.FILESTACK.SECURITY
                ? {
                    policy: EnvironmentConfig.FILESTACK.SECURITY.POLICY,
                    signature: EnvironmentConfig.FILESTACK.SECURITY.SIGNATURE,
                }
                : undefined,
        })
    }, [])

    const membersById = useMemo<Record<string, ProjectMember>>(() => (
        projectMembersResult.members.reduce<Record<string, ProjectMember>>((accumulator, member) => {
            if (member.userId !== undefined && member.userId !== null) {
                accumulator[String(member.userId)] = member
            }

            return accumulator
        }, {})
    ), [projectMembersResult.members])

    const fileAttachments = useMemo(
        () => attachmentsResult.attachments
            .filter(attachment => getAttachmentType(attachment) === ATTACHMENT_TYPE_FILE)
            .sort(
                (attachmentA, attachmentB) => getAttachmentSortValue(attachmentB)
                    - getAttachmentSortValue(attachmentA),
            ),
        [attachmentsResult.attachments],
    )

    const linkAttachments = useMemo(
        () => attachmentsResult.attachments
            .filter(attachment => getAttachmentType(attachment) === ATTACHMENT_TYPE_LINK)
            .sort(
                (attachmentA, attachmentB) => getAttachmentSortValue(attachmentB)
                    - getAttachmentSortValue(attachmentA),
            ),
        [attachmentsResult.attachments],
    )

    const visibleAttachments = activeTab === 'files'
        ? fileAttachments
        : linkAttachments

    const pageTitle = projectResult.project?.name
        ? `${projectResult.project.name} Assets`
        : 'Project Assets'

    const handleCloseUploadOptionsModal = useCallback(() => {
        if (isSavingUploadOptions) {
            return
        }

        setShowUploadOptionsModal(false)
        setPendingUploadFiles([])
        setUploadAllowedUsers([])
        setUploadShareMode('all')
    }, [isSavingUploadOptions])

    const handleOpenFilePicker = useCallback((): void => {
        if (!projectId) {
            return
        }

        if (!filestackClient) {
            toast.error('File uploads are not configured for this environment.')
            return
        }

        const uploadedFiles: PickerFileMetadata[] = []
        const attachmentsStorePath = `${PROJECT_ATTACHMENTS_FOLDER}/${projectId}/`
        const pickerOptions: PickerOptions = {
            accept: FILE_PICKER_ACCEPT,
            fromSources: ASSETS_FILE_PICKER_FROM_SOURCES,
            maxFiles: ASSETS_FILE_PICKER_MAX_FILES,
            onClose: () => {
                setIsOpeningPicker(false)
                if (!uploadedFiles.length) {
                    return
                }

                setPendingUploadFiles(uploadedFiles)
                setUploadAllowedUsers([])
                setUploadShareMode('all')
                setShowUploadOptionsModal(true)
            },
            onFileUploadFinished: file => {
                uploadedFiles.push(file)
            },
            storeTo: {
                container: FILE_PICKER_SUBMISSION_CONTAINER_NAME,
                location: 's3',
                path: attachmentsStorePath,
                region: EnvironmentConfig.FILESTACK.REGION,
            },
            uploadInBackground: false,
        }

        try {
            setIsOpeningPicker(true)
            filestackClient.picker(pickerOptions)
                .open()
        } catch (error) {
            setIsOpeningPicker(false)
            toast.error(getErrorMessage(error, 'Failed to open file picker.'))
        }
    }, [filestackClient, projectId])

    const handleSaveUploadOptions = useCallback(async (): Promise<void> => {
        if (!projectId || !pendingUploadFiles.length) {
            return
        }

        if (uploadShareMode === 'selected' && !uploadAllowedUsers.length) {
            toast.error('Select at least one member to share these files with.')
            return
        }

        const allowedUsers = uploadShareMode === 'selected'
            ? uploadAllowedUsers
            : undefined

        setIsSavingUploadOptions(true)
        try {
            await Promise.all(pendingUploadFiles.map(file => {
                const storagePath = toOptionalString(file.key)

                if (!storagePath) {
                    throw new Error(`"${file.filename}" is missing storage path.`)
                }

                return addProjectAttachment(projectId, {
                    allowedUsers,
                    contentType: file.mimetype || 'application/unknown',
                    description: '',
                    path: storagePath,
                    size: file.size,
                    title: file.filename,
                    type: ATTACHMENT_TYPE_FILE,
                })
            }))

            await attachmentsResult.mutate()
            toast.success(pendingUploadFiles.length > 1
                ? 'Files added successfully.'
                : 'File added successfully.')
            handleCloseUploadOptionsModal()
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to add file.'))
        } finally {
            setIsSavingUploadOptions(false)
        }
    }, [
        attachmentsResult,
        handleCloseUploadOptionsModal,
        pendingUploadFiles,
        projectId,
        uploadAllowedUsers,
        uploadShareMode,
    ])

    const handleOpenAddLinkModal = useCallback(() => {
        setEditingLink(undefined)
        setLinkTitle('')
        setLinkPath('')
        setLinkError(undefined)
        setShowLinkModal(true)
    }, [])

    const handleOpenEditLinkModal = useCallback((attachment: ProjectAttachment) => {
        setEditingLink(attachment)
        setLinkTitle(getAttachmentTitle(attachment))
        setLinkPath(toOptionalString(attachment.path) || '')
        setLinkError(undefined)
        setShowLinkModal(true)
    }, [])

    const handleCloseLinkModal = useCallback(() => {
        if (isSavingLink) {
            return
        }

        setShowLinkModal(false)
        setEditingLink(undefined)
        setLinkError(undefined)
    }, [isSavingLink])

    const handleSaveLink = useCallback(async (): Promise<void> => {
        if (!projectId) {
            return
        }

        const trimmedTitle = linkTitle.trim()
        const trimmedPath = linkPath.trim()

        if (!trimmedTitle) {
            setLinkError('Name is required.')
            return
        }

        if (!trimmedPath || !isValidUrl(trimmedPath)) {
            setLinkError('A valid URL is required.')
            return
        }

        setLinkError(undefined)
        setIsSavingLink(true)
        try {
            if (editingLink?.id) {
                await updateProjectAttachment(projectId, editingLink.id, {
                    path: ensureHttpProtocol(trimmedPath),
                    title: trimmedTitle,
                })
            } else {
                await addProjectAttachment(projectId, {
                    path: ensureHttpProtocol(trimmedPath),
                    tags: [],
                    title: trimmedTitle,
                    type: ATTACHMENT_TYPE_LINK,
                })
            }

            await attachmentsResult.mutate()
            toast.success(editingLink
                ? 'Link updated successfully.'
                : 'Link added successfully.')
            handleCloseLinkModal()
        } catch (error) {
            setLinkError(getErrorMessage(error, editingLink
                ? 'Failed to update link.'
                : 'Failed to add link.'))
        } finally {
            setIsSavingLink(false)
        }
    }, [
        attachmentsResult,
        editingLink,
        handleCloseLinkModal,
        linkPath,
        linkTitle,
        projectId,
    ])

    const handleOpenEditFileModal = useCallback((attachment: ProjectAttachment) => {
        setEditingFile(attachment)
        setFileTitle(getAttachmentTitle(attachment))
        setFileAllowedUsers(Array.isArray(attachment.allowedUsers)
            ? attachment.allowedUsers.map(user => String(user))
            : [])
        setFileError(undefined)
        setShowEditFileModal(true)
    }, [])

    const handleCloseEditFileModal = useCallback(() => {
        if (isSavingFile) {
            return
        }

        setShowEditFileModal(false)
        setEditingFile(undefined)
        setFileError(undefined)
    }, [isSavingFile])

    const handleSaveFile = useCallback(async (): Promise<void> => {
        if (!projectId || !editingFile?.id) {
            return
        }

        const trimmedTitle = fileTitle.trim()
        if (!trimmedTitle) {
            setFileError('Title is required.')
            return
        }

        setFileError(undefined)
        setIsSavingFile(true)
        try {
            await updateProjectAttachment(projectId, editingFile.id, {
                allowedUsers: fileAllowedUsers.length
                    ? fileAllowedUsers
                    : undefined,
                title: trimmedTitle,
            })

            await attachmentsResult.mutate()
            toast.success('File updated successfully.')
            handleCloseEditFileModal()
        } catch (error) {
            setFileError(getErrorMessage(error, 'Failed to update file.'))
        } finally {
            setIsSavingFile(false)
        }
    }, [
        attachmentsResult,
        editingFile,
        fileAllowedUsers,
        fileTitle,
        handleCloseEditFileModal,
        projectId,
    ])

    const handleDeleteAttachment = useCallback(async (): Promise<void> => {
        if (!projectId || !attachmentToDelete?.id) {
            return
        }

        setIsDeletingAttachment(true)
        try {
            await removeProjectAttachment(projectId, attachmentToDelete.id)
            await attachmentsResult.mutate()
            toast.success(getAttachmentType(attachmentToDelete) === ATTACHMENT_TYPE_LINK
                ? 'Link removed successfully.'
                : 'File removed successfully.')
            setAttachmentToDelete(undefined)
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to remove attachment.'))
        } finally {
            setIsDeletingAttachment(false)
        }
    }, [attachmentsResult, attachmentToDelete, projectId])

    const handleDownloadFile = useCallback(async (attachment: ProjectAttachment): Promise<void> => {
        if (!projectId) {
            return
        }

        const attachmentId = toOptionalString(attachment.id)
        if (!attachmentId) {
            const fallbackUrl = buildAttachmentUrl(attachment)
            if (fallbackUrl) {
                window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
                return
            }

            toast.error('File URL unavailable.')
            return
        }

        setDownloadingAttachmentId(attachmentId)
        try {
            const latestAttachment = await fetchProjectAttachment(projectId, attachmentId)
            const fileUrl = buildAttachmentUrl(latestAttachment)
                || buildAttachmentUrl(attachment)

            if (!fileUrl) {
                throw new Error('File URL unavailable.')
            }

            window.open(fileUrl, '_blank', 'noopener,noreferrer')
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to open file.'))
        } finally {
            setDownloadingAttachmentId(undefined)
        }
    }, [projectId])

    function toggleUserSelection(
        userId: string,
        selectedUsers: string[],
        onChange: (nextUsers: string[]) => void,
    ): void {
        if (selectedUsers.includes(userId)) {
            onChange(selectedUsers.filter(selectedUser => selectedUser !== userId))
            return
        }

        onChange([
            ...selectedUsers,
            userId,
        ])
    }

    const projectTabs = projectId
        ? <ProjectListTabs projectId={projectId} />
        : undefined
    const billingAccountExpiredNotice = projectId
        ? (
            <ProjectBillingAccountExpiredNotice
                billingAccountId={projectResult.project?.billingAccountId}
                billingAccountName={projectResult.project?.billingAccountName}
                projectId={projectId}
            />
        )
        : undefined
    const titleAction = projectId
        ? (
            <div className={styles.projectTitleActions}>
                <Link
                    aria-label='Edit project'
                    className={styles.projectEditLink}
                    to={`/projects/${projectId}/edit`}
                >
                    <IconOutline.PencilIcon className={styles.projectEditIcon} />
                </Link>
                <Link
                    aria-label='Manage project users'
                    className={styles.projectUsersLink}
                    state={{
                        backTo: `${location.pathname}${location.search}${location.hash}`,
                    }}
                    to={`/projects/${projectId}/users`}
                >
                    <IconOutline.UserIcon className={styles.projectUsersIcon} />
                </Link>
                <Link
                    aria-label='Open project assets'
                    className={styles.projectAssetsLink}
                    to={`/projects/${projectId}/assets`}
                >
                    <IconOutline.DocumentTextIcon className={styles.projectAssetsIcon} />
                </Link>
            </div>
        )
        : undefined

    if (!projectId) {
        return (
            <PageWrapper pageTitle='Project Assets' breadCrumb={[]}>
                <ErrorMessage message='Project id is required.' />
            </PageWrapper>
        )
    }

    if (projectResult.isLoading || projectMembersResult.isLoading || attachmentsResult.isLoading) {
        return (
            <PageWrapper pageTitle={pageTitle} breadCrumb={[]} titleAction={titleAction}>
                {billingAccountExpiredNotice}
                {projectTabs}
                <LoadingSpinner />
            </PageWrapper>
        )
    }

    if (projectResult.error) {
        return (
            <PageWrapper pageTitle={pageTitle} breadCrumb={[]} titleAction={titleAction}>
                {billingAccountExpiredNotice}
                {projectTabs}
                <ErrorMessage message={projectResult.error.message} />
            </PageWrapper>
        )
    }

    if (projectMembersResult.error) {
        return (
            <PageWrapper pageTitle={pageTitle} breadCrumb={[]} titleAction={titleAction}>
                {billingAccountExpiredNotice}
                {projectTabs}
                <ErrorMessage message={projectMembersResult.error.message} />
            </PageWrapper>
        )
    }

    if (attachmentsResult.error) {
        return (
            <PageWrapper pageTitle={pageTitle} breadCrumb={[]} titleAction={titleAction}>
                {billingAccountExpiredNotice}
                {projectTabs}
                <ErrorMessage
                    message={attachmentsResult.error.message}
                    onRetry={() => {
                        attachmentsResult.mutate()
                            .catch(() => undefined)
                    }}
                />
            </PageWrapper>
        )
    }

    return (
        <PageWrapper pageTitle={pageTitle} breadCrumb={[]} titleAction={titleAction}>
            {billingAccountExpiredNotice}
            {projectTabs}
            <div className={styles.container}>
                <div className={styles.headerRow}>
                    <h4 className={styles.sectionTitle}>Assets Library</h4>

                    <div className={styles.headerActions}>
                        <Button
                            label={activeTab === 'files'
                                ? 'Add New File'
                                : 'Add New Link'}
                            onClick={activeTab === 'files'
                                ? handleOpenFilePicker
                                : handleOpenAddLinkModal}
                            primary
                            size='md'
                            disabled={isOpeningPicker}
                        />
                        <Link className={styles.backLink} to={`/projects/${projectId}/challenges`}>
                            <Button
                                label='Back'
                                secondary
                                size='md'
                            />
                        </Link>
                    </div>
                </div>

                <div className={styles.assetTabs}>
                    <button
                        className={classNames(
                            styles.assetTabButton,
                            activeTab === 'files' ? styles.assetTabButtonActive : undefined,
                        )}
                        onClick={() => setActiveTab('files')}
                        type='button'
                    >
                        Files
                        {' '}
                        <span className={styles.assetTabCount}>{fileAttachments.length}</span>
                    </button>
                    <button
                        className={classNames(
                            styles.assetTabButton,
                            activeTab === 'links' ? styles.assetTabButtonActive : undefined,
                        )}
                        onClick={() => setActiveTab('links')}
                        type='button'
                    >
                        Links
                        {' '}
                        <span className={styles.assetTabCount}>{linkAttachments.length}</span>
                    </button>
                </div>

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Name</th>
                                <th>Shared With</th>
                                <th>Created By</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleAttachments.length
                                ? visibleAttachments.map(attachment => {
                                    const attachmentKey = getAttachmentKey(attachment)
                                    const canEdit = canEditAttachment(
                                        attachment,
                                        currentUserHandle,
                                        currentUserId,
                                        workAppContext.isAdmin,
                                    )
                                    const isLink = getAttachmentType(attachment) === ATTACHMENT_TYPE_LINK
                                    const linkTarget = ensureHttpProtocol(toOptionalString(attachment.path) || '')
                                    const isDownloading = toOptionalString(attachment.id) === downloadingAttachmentId
                                    const attachmentDate = formatAttachmentDate(
                                        attachment.updatedAt || attachment.createdAt,
                                    )

                                    return (
                                        <tr key={attachmentKey}>
                                            <td>
                                                <span className={styles.typeBadge}>{getFileTypeLabel(attachment)}</span>
                                            </td>
                                            <td className={styles.nameCell}>
                                                {isLink
                                                    ? (
                                                        <a
                                                            className={styles.nameLink}
                                                            href={linkTarget}
                                                            rel='noopener noreferrer'
                                                            target='_blank'
                                                        >
                                                            {getAttachmentTitle(attachment)}
                                                        </a>
                                                    )
                                                    : (
                                                        <button
                                                            className={styles.downloadButton}
                                                            disabled={isDownloading}
                                                            onClick={() => {
                                                                handleDownloadFile(attachment)
                                                                    .catch(() => undefined)
                                                            }}
                                                            type='button'
                                                        >
                                                            {isDownloading
                                                                ? 'Opening...'
                                                                : getAttachmentTitle(attachment)}
                                                        </button>
                                                    )}
                                            </td>
                                            <td className={styles.sharedWith}>
                                                {getAttachmentSharedWith(attachment, membersById)}
                                            </td>
                                            <td>{getAttachmentOwner(attachment, membersById)}</td>
                                            <td>{attachmentDate}</td>
                                            <td>
                                                <div className={styles.actions}>
                                                    {canEdit
                                                        ? (
                                                            <>
                                                                <button
                                                                    className={styles.actionButton}
                                                                    onClick={() => {
                                                                        if (isLink) {
                                                                            handleOpenEditLinkModal(attachment)
                                                                            return
                                                                        }

                                                                        handleOpenEditFileModal(attachment)
                                                                    }}
                                                                    type='button'
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className={classNames(
                                                                        styles.actionButton,
                                                                        styles.actionDelete,
                                                                    )}
                                                                    onClick={() => setAttachmentToDelete(attachment)}
                                                                    type='button'
                                                                >
                                                                    Remove
                                                                </button>
                                                            </>
                                                        )
                                                        : (
                                                            <span className={styles.readOnlyLabel}>
                                                                View only
                                                            </span>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                                : (
                                    <tr>
                                        <td className={styles.emptyRow} colSpan={6}>
                                            {activeTab === 'files'
                                                ? 'No files found.'
                                                : 'No links found.'}
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>

            <BaseModal
                open={showUploadOptionsModal}
                onClose={handleCloseUploadOptionsModal}
                title='Attachment Options'
                size='md'
                buttons={(
                    <>
                        <Button
                            label='Cancel'
                            onClick={handleCloseUploadOptionsModal}
                            secondary
                            disabled={isSavingUploadOptions}
                        />
                        <Button
                            label={isSavingUploadOptions
                                ? 'Saving...'
                                : 'Add Files'}
                            onClick={() => {
                                handleSaveUploadOptions()
                                    .catch(() => undefined)
                            }}
                            primary
                            disabled={isSavingUploadOptions}
                        />
                    </>
                )}
            >
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Who do you want to share these files with?
                    </p>

                    <div className={styles.shareOptions}>
                        <label className={styles.radioLabel}>
                            <input
                                checked={uploadShareMode === 'all'}
                                name='upload-share-mode'
                                onChange={() => setUploadShareMode('all')}
                                type='radio'
                            />
                            <span>All project members</span>
                        </label>
                        <label className={styles.radioLabel}>
                            <input
                                checked={uploadShareMode === 'selected'}
                                name='upload-share-mode'
                                onChange={() => setUploadShareMode('selected')}
                                type='radio'
                            />
                            <span>Only specific members</span>
                        </label>
                    </div>

                    {uploadShareMode === 'selected'
                        ? (
                            <div className={styles.membersList}>
                                {projectMembersResult.members.map(member => {
                                    const userId = member.userId === undefined || member.userId === null
                                        ? undefined
                                        : String(member.userId)

                                    if (!userId) {
                                        return undefined
                                    }

                                    return (
                                        <label key={userId} className={styles.memberOption}>
                                            <input
                                                checked={uploadAllowedUsers.includes(userId)}
                                                onChange={() => toggleUserSelection(
                                                    userId,
                                                    uploadAllowedUsers,
                                                    setUploadAllowedUsers,
                                                )}
                                                type='checkbox'
                                            />
                                            <span>{member.handle || member.email || userId}</span>
                                        </label>
                                    )
                                })}
                            </div>
                        )
                        : undefined}

                    <div className={styles.uploadSummary}>
                        {pendingUploadFiles.length}
                        {' '}
                        file
                        {pendingUploadFiles.length === 1 ? '' : 's'}
                        {' '}
                        ready to add.
                    </div>
                </div>
            </BaseModal>

            <BaseModal
                open={showLinkModal}
                onClose={handleCloseLinkModal}
                title={editingLink
                    ? 'Edit Link'
                    : 'Add a Link'}
                size='md'
                buttons={(
                    <>
                        <Button
                            label='Cancel'
                            onClick={handleCloseLinkModal}
                            secondary
                            disabled={isSavingLink}
                        />
                        <Button
                            label={isSavingLink
                                ? 'Saving...'
                                : (editingLink
                                    ? 'Save Link'
                                    : 'Add Link')}
                            onClick={() => {
                                handleSaveLink()
                                    .catch(() => undefined)
                            }}
                            primary
                            disabled={isSavingLink}
                        />
                    </>
                )}
            >
                <div className={styles.modalContent}>
                    <label className={styles.fieldLabel} htmlFor='assets-link-title'>Name</label>
                    <input
                        className={styles.textField}
                        id='assets-link-title'
                        onChange={event => setLinkTitle(event.target.value)}
                        placeholder='Link name'
                        type='text'
                        value={linkTitle}
                    />

                    <label className={styles.fieldLabel} htmlFor='assets-link-url'>URL</label>
                    <input
                        className={styles.textField}
                        id='assets-link-url'
                        onChange={event => setLinkPath(event.target.value)}
                        placeholder='https://example.com'
                        type='text'
                        value={linkPath}
                    />

                    {linkError
                        ? <div className={styles.formError}>{linkError}</div>
                        : undefined}
                </div>
            </BaseModal>

            <BaseModal
                open={showEditFileModal}
                onClose={handleCloseEditFileModal}
                title='Edit File'
                size='md'
                buttons={(
                    <>
                        <Button
                            label='Cancel'
                            onClick={handleCloseEditFileModal}
                            secondary
                            disabled={isSavingFile}
                        />
                        <Button
                            label={isSavingFile
                                ? 'Saving...'
                                : 'Save File'}
                            onClick={() => {
                                handleSaveFile()
                                    .catch(() => undefined)
                            }}
                            primary
                            disabled={isSavingFile}
                        />
                    </>
                )}
            >
                <div className={styles.modalContent}>
                    <label className={styles.fieldLabel} htmlFor='assets-file-title'>Title</label>
                    <input
                        className={styles.textField}
                        id='assets-file-title'
                        onChange={event => setFileTitle(event.target.value)}
                        placeholder='File title'
                        type='text'
                        value={fileTitle}
                    />

                    <label className={styles.fieldLabel}>File viewers</label>
                    <div className={styles.membersList}>
                        {projectMembersResult.members.map(member => {
                            const userId = member.userId === undefined || member.userId === null
                                ? undefined
                                : String(member.userId)

                            if (!userId) {
                                return undefined
                            }

                            return (
                                <label key={userId} className={styles.memberOption}>
                                    <input
                                        checked={fileAllowedUsers.includes(userId)}
                                        onChange={() => toggleUserSelection(
                                            userId,
                                            fileAllowedUsers,
                                            setFileAllowedUsers,
                                        )}
                                        type='checkbox'
                                    />
                                    <span>{member.handle || member.email || userId}</span>
                                </label>
                            )
                        })}
                    </div>
                    <div className={styles.viewerHint}>
                        Leave empty to allow all project members.
                    </div>

                    {fileError
                        ? <div className={styles.formError}>{fileError}</div>
                        : undefined}
                </div>
            </BaseModal>

            {attachmentToDelete
                ? (
                    <ConfirmationModal
                        cancelText='Cancel'
                        confirmText={getAttachmentType(attachmentToDelete) === ATTACHMENT_TYPE_LINK
                            ? 'Delete Link'
                            : 'Delete File'}
                        message={getAttachmentType(attachmentToDelete) === ATTACHMENT_TYPE_LINK
                            ? 'Your team might need this link. This action cannot be undone.'
                            : 'Your team might need this file. This action cannot be undone.'}
                        onCancel={() => setAttachmentToDelete(undefined)}
                        onConfirm={() => {
                            if (isDeletingAttachment) {
                                return
                            }

                            handleDeleteAttachment()
                                .catch(() => undefined)
                        }}
                        title={getAttachmentType(attachmentToDelete) === ATTACHMENT_TYPE_LINK
                            ? `Delete "${getAttachmentTitle(attachmentToDelete)}"?`
                            : `Delete "${getAttachmentTitle(attachmentToDelete)}"?`}
                    />
                )
                : undefined}
        </PageWrapper>
    )
}

export default ProjectAssetsPage
