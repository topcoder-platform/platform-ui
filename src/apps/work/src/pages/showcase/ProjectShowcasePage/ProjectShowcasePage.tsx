/* eslint-disable complexity */
import {
    ChangeEvent,
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { init, type PickerOptions } from 'filestack-js'
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { SingleValue } from 'react-select'
import classNames from 'classnames'

import { EnvironmentConfig } from '~/config'
import { BaseModal, Button, LoadingSpinner, useConfirmationModal } from '~/libs/ui'

import {
    ErrorMessage,
    Pagination,
    ProjectPageWrapper,
    ProjectsShowcaseFilter,
} from '../../../lib/components'
import {
    WorkAppContext,
} from '../../../lib/contexts'
import {
    archiveProjectShowcasePost,
    createProjectShowcasePost,
    createProjectShowcasePostCategory,
    createProjectShowcasePostIndustry,
    fetchChallenge,
    fetchChallenges,
    fetchProjectShowcasePost,
    updateProjectShowcasePost,
} from '../../../lib/services'
import {
    useFetchProject,
    useFetchProjectShowcasePostCategories,
    useFetchProjectShowcasePostIndustries,
    useFetchProjectShowcasePosts,
} from '../../../lib/hooks'
import {
    FormMarkdownEditor,
    FormSelectField,
    FormSelectOption,
    FormTextField,
} from '../../../lib/components/form'
import { showErrorToast, showSuccessToast } from '../../../lib/utils/toast.utils'
import { checkCanManageProject } from '../../../lib/utils/permissions.utils'
import type {
    FetchProjectShowcasePostsParams,
    ProjectShowcasePost,
    ProjectShowcasePostCategory,
    ProjectShowcasePostFilters,
    ProjectShowcasePostIndustry,
    WorkAppContextModel,
} from '../../../lib/models'

import styles from './ProjectShowcasePage.module.scss'

type SelectOption = FormSelectOption

const DEFAULT_FILTERS: ProjectShowcasePostFilters = {
    categoryId: undefined,
    industryId: undefined,
    keyword: undefined,
    status: undefined,
}

const DEFAULT_PER_PAGE = 10

const STATUS_OPTIONS: SelectOption[] = [
    { label: 'All statuses', value: '' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Published', value: 'PUBLISHED' },
    { label: 'Archived', value: 'ARCHIVED' },
]

const SHOWCASE_MEDIA_FILE_PICKER_FROM_SOURCES = ['local_file_system']
const SHOWCASE_MEDIA_FILE_PICKER_MAX_FILES = 10
const SHOWCASE_MEDIA_FILE_PICKER_ACCEPT = [
    '.bmp',
    '.gif',
    '.jpg',
    '.jpeg',
    '.png',
    '.pdf',
    '.webm',
    '.mp4',
    '.mov',
    '.avi',
]
const SHOWCASE_MEDIA_FILE_PICKER_CONTAINER = EnvironmentConfig.FILESTACK_SHOWCASE_MEDIA_FILE_PICKER_CONTAINER

function getStatusLabel(status: string): string {
    return status
        .toLowerCase()
        .split(/[_ ]+/)
        .map(segment => {
            const firstCharacter = segment.charAt(0)
            return `${firstCharacter.toUpperCase()}${segment.slice(1)}`
        })
        .join(' ')
}

function getStatusPillClass(status: string): string {
    const normalizedStatus = status.toLowerCase()

    if (normalizedStatus === 'published') {
        return styles.statusGreen
    }

    if (normalizedStatus === 'archived') {
        return styles.statusRed
    }

    return styles.statusGray
}

function getSortIndicator(
    currentSortBy: string,
    currentSortOrder: 'asc' | 'desc',
    fieldName: string,
): string {
    if (currentSortBy !== fieldName) {
        return ''
    }

    return currentSortOrder === 'asc'
        ? ' \u2191'
        : ' \u2193'
}

function formatDate(value: string | undefined): string {
    if (!value) {
        return '—'
    }

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
        return value
    }

    return parsed.toLocaleString('en-US', {
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

function normalizeTaxonomyOption(item: ProjectShowcasePostCategory | ProjectShowcasePostIndustry): SelectOption {
    return {
        label: item.name,
        value: item.id,
    }
}

interface ProjectShowcasePostFormData {
    title: string
    content: string
    industryIds: string[]
    categoryIds: string[]
    challengeIds: string[]
    media: Array<{
        type: string
        url: string
    }>
}

function mapPostToFormData(post?: ProjectShowcasePost): ProjectShowcasePostFormData {
    return {
        categoryIds: post?.categories.map(item => item.id) || [],
        challengeIds: post?.challengeIds || [],
        content: post?.content || '',
        industryIds: post?.industries.map(item => item.id) || [],
        media: post?.media?.map(item => ({
            type: item.type,
            url: item.url,
        })) || [],
        title: post?.title || '',
    }
}

async function loadProjectChallenges(
    projectId: string,
    inputValue: string,
): Promise<FormSelectOption[]> {
    const response = await fetchChallenges(
        { name: inputValue, projectId },
        { page: 1, perPage: 20 },
    )

    return response.data.map(challenge => ({
        label: challenge.name,
        value: challenge.id,
    }))
}

async function resolveTaxonomyIds<
    T extends ProjectShowcasePostCategory | ProjectShowcasePostIndustry,
>(
    selectedIds: string[],
    options: SelectOption[],
    createEntity: (name: string) => Promise<T>,
): Promise<string[]> {
    const existingIds = new Set(options.map(option => option.value)
        .filter(Boolean))
    const createdNames: string[] = []
    const createdNameSet = new Set<string>()
    const resolvedIds: string[] = []

    for (const selectedId of selectedIds) {
        const trimmedId = selectedId.trim()
        if (trimmedId) {
            if (existingIds.has(trimmedId)) {
                resolvedIds.push(trimmedId)
            } else if (!createdNameSet.has(trimmedId)) {
                createdNameSet.add(trimmedId)
                createdNames.push(trimmedId)
            }
        }
    }

    const createdItems = await Promise.all(
        createdNames.map(name => createEntity(name)),
    )

    return [
        ...resolvedIds,
        ...createdItems.map(item => item.id),
    ]
}

function createTaxonomyOptions(
    items: Array<ProjectShowcasePostCategory | ProjectShowcasePostIndustry>,
    defaultLabel?: string,
): SelectOption[] {
    return [
        ...(defaultLabel ? [{ label: defaultLabel, value: '' }] : []),
        ...items.map(normalizeTaxonomyOption),
    ]
}

function findSelectedOption(
    options: SelectOption[],
    value: string | undefined,
): SelectOption | undefined {
    return options.find(option => option.value === (value || ''))
}

function buildProjectShowcaseFetchParams(
    projectId: string | undefined,
    filters: ProjectShowcasePostFilters,
    page: number,
    perPage: number,
    sortBy: string,
    sortOrder: 'asc' | 'desc',
): FetchProjectShowcasePostsParams {
    return {
        categoryId: filters.categoryId,
        industryId: filters.industryId,
        keyword: filters.keyword,
        page,
        perPage,
        projectId: projectId ?? '',
        sortBy,
        sortOrder,
        status: filters.status,
    }
}

function getProjectShowcaseError(
    postsError: Error | undefined,
    industriesError: Error | undefined,
    categoriesError: Error | undefined,
): Error | undefined {
    return postsError || industriesError || categoriesError
}

function getProjectShowcaseLoading(
    postsLoading: boolean,
    industriesLoading: boolean,
    categoriesLoading: boolean,
): boolean {
    return postsLoading || industriesLoading || categoriesLoading
}

function getPostSortValue(
    post: ProjectShowcasePost,
    sortBy: string,
): string {
    switch (sortBy) {
        case 'title':
            return post.title.toLowerCase()
        case 'industry':
            return post.industries
                .map(item => item.name.toLowerCase())
                .join(', ')
        case 'category':
            return post.categories
                .map(item => item.name.toLowerCase())
                .join(', ')
        default:
            return ''
    }
}

function sortProjectShowcasePosts(
    posts: ProjectShowcasePost[],
    sortBy: string,
    sortOrder: 'asc' | 'desc',
): ProjectShowcasePost[] {
    return [...posts].sort((left, right) => {
        const leftValue = getPostSortValue(left, sortBy)
        const rightValue = getPostSortValue(right, sortBy)

        if (leftValue < rightValue) {
            return sortOrder === 'asc' ? -1 : 1
        }

        if (leftValue > rightValue) {
            return sortOrder === 'asc' ? 1 : -1
        }

        return 0
    })
}

export const ProjectShowcasePage: FC = () => {
    const params = useParams<{ projectId: string }>()
    const projectId = params.projectId

    const [filters, setFilters] = useState<ProjectShowcasePostFilters>(DEFAULT_FILTERS)
    const [keywordInput, setKeywordInput] = useState<string>('')
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE)
    const [sortBy, setSortBy] = useState<string>('updatedAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    const isFirstDebouncedRender = useRef<boolean>(true)

    const projectResult = useFetchProject(projectId || undefined)
    const industriesResult = useFetchProjectShowcasePostIndustries()
    const categoriesResult = useFetchProjectShowcasePostCategories()

    const fetchParams = useMemo(
        () => buildProjectShowcaseFetchParams(
            projectId,
            filters,
            page,
            perPage,
            sortBy,
            sortOrder,
        ),
        [projectId, filters, page, perPage, sortBy, sortOrder],
    )

    const postsResult = useFetchProjectShowcasePosts(fetchParams)

    useEffect(() => {
        setKeywordInput(filters.keyword || '')
    }, [filters.keyword])

    useEffect(() => {
        if (isFirstDebouncedRender.current) {
            isFirstDebouncedRender.current = false
            return undefined
        }

        const timeout = window.setTimeout(() => {
            setFilters(current => ({
                ...current,
                keyword: keywordInput || undefined,
            }))
            setPage(1)
        }, 350)

        return () => {
            window.clearTimeout(timeout)
        }
    }, [keywordInput])

    const industryOptions = useMemo<SelectOption[]>(
        () => createTaxonomyOptions(industriesResult.items, 'All Industries'),
        [industriesResult.items],
    )

    const categoryOptions = useMemo<SelectOption[]>(
        () => createTaxonomyOptions(categoriesResult.items, 'All Categories'),
        [categoriesResult.items],
    )

    const selectedStatus = findSelectedOption(STATUS_OPTIONS, filters.status)
    const selectedIndustry = findSelectedOption(industryOptions, filters.industryId)
    const selectedCategory = findSelectedOption(categoryOptions, filters.categoryId)

    const filteredPosts = useMemo(
        () => sortProjectShowcasePosts(postsResult.posts, sortBy, sortOrder),
        [postsResult.posts, sortBy, sortOrder],
    )

    const {
        isAdmin: isAdminUser,
        loginUserInfo,
        userRoles,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const canManageProjectShowcasePosts = useMemo(
        () => checkCanManageProject(userRoles, loginUserInfo?.userId, projectResult.project),
        [loginUserInfo?.userId, projectResult.project, userRoles],
    )

    const hasProjectId = Boolean(projectId)
    const isLoading = getProjectShowcaseLoading(
        postsResult.isLoading,
        industriesResult.isLoading,
        categoriesResult.isLoading,
    )
    const error = getProjectShowcaseError(
        postsResult.error,
        industriesResult.error,
        categoriesResult.error,
    )
    const totalPosts = postsResult.metadata.total ?? 0
    const shouldShowPagination = !error && totalPosts > 0

    const handleStatusChange = useCallback((option: SingleValue<SelectOption>) => {
        setFilters(current => ({
            ...current,
            status: option?.value || undefined,
        }))
        setPage(1)
    }, [])

    const handleIndustryChange = useCallback((option: SingleValue<SelectOption>) => {
        setFilters(current => ({
            ...current,
            industryId: option?.value || undefined,
        }))
        setPage(1)
    }, [])

    const handleCategoryChange = useCallback((option: SingleValue<SelectOption>) => {
        setFilters(current => ({
            ...current,
            categoryId: option?.value || undefined,
        }))
        setPage(1)
    }, [])

    const handleSearchInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setKeywordInput(event.target.value)
    }, [])

    const handlePerPageChange = useCallback((newPerPage: number) => {
        setPerPage(newPerPage)
        setPage(1)
    }, [])

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
    }, [])

    const handleSort = useCallback((fieldName: string) => {
        setPage(1)

        if (fieldName === sortBy) {
            setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'))
            return
        }

        setSortBy(fieldName)
        setSortOrder('desc')
    }, [sortBy])

    const handleSortByTitle = useCallback(() => handleSort('title'), [handleSort])
    const handleSortByIndustry = useCallback(() => handleSort('industry'), [handleSort])
    const handleSortByCategory = useCallback(() => handleSort('category'), [handleSort])

    const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false)
    const [manageMode, setManageMode] = useState<'create' | 'edit'>('create')
    const [selectedPostId, setSelectedPostId] = useState<string | undefined>(undefined)
    const [isLoadingPostDetails, setIsLoadingPostDetails] = useState<boolean>(false)
    const [selectedChallengeOptions, setSelectedChallengeOptions] = useState<FormSelectOption[]>([])
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [formError, setFormError] = useState<string | undefined>(undefined)
    const [isPublishing, setIsPublishing] = useState<boolean>(false)
    const [isUnpublishing, setIsUnpublishing] = useState<boolean>(false)
    const [isRestoring, setIsRestoring] = useState<boolean>(false)
    const [isOpeningMediaPicker, setIsOpeningMediaPicker] = useState<boolean>(false)
    const [mediaLimitWarning, setMediaLimitWarning] = useState<string | undefined>(undefined)
    const confirmation = useConfirmationModal()
    // const projectResult = useFetchProject(projectId || undefined)

    const handleOpenCreateModal = useCallback(() => {
        setManageMode('create')
        setIsManageModalOpen(true)
    }, [])

    const handleEditPost = useCallback((postId: string) => {
        setManageMode('edit')
        setSelectedPostId(postId)
        setIsManageModalOpen(true)
    }, [])

    const handlePublishPost = useCallback(async (post: ProjectShowcasePost) => {
        if (!projectId) {
            return
        }

        const confirmed = await confirmation.confirm({
            content: (
                <p>
                    Are you sure you want to publish the post
                    {' '}
                    <strong>{post.title}</strong>
                    ?
                </p>
            ),
            title: 'Publish Post',
        })

        if (!confirmed) {
            return
        }

        setIsPublishing(true)

        try {
            await updateProjectShowcasePost(projectId, post.id, {
                status: 'PUBLISHED',
            })
            await postsResult.mutate()
            showSuccessToast('Post published successfully')
        } catch (err) {
            showErrorToast(err instanceof Error ? err.message : 'Unable to publish post.')
        } finally {
            setIsPublishing(false)
        }
    }, [confirmation, postsResult, projectId])

    const handleUnpublishPost = useCallback(async (post: ProjectShowcasePost) => {
        if (!projectId) {
            return
        }

        const confirmed = await confirmation.confirm({
            content: (
                <p>
                    Are you sure you want to unpublish the post
                    {' '}
                    <strong>{post.title}</strong>
                    ?
                </p>
            ),
            title: 'Unpublish Post',
        })

        if (!confirmed) {
            return
        }

        setIsUnpublishing(true)

        try {
            await updateProjectShowcasePost(projectId, post.id, {
                status: 'DRAFT',
            })
            await postsResult.mutate()
            showSuccessToast('Post unpublished successfully')
        } catch (err) {
            showErrorToast(err instanceof Error ? err.message : 'Unable to unpublish post.')
        } finally {
            setIsUnpublishing(false)
        }
    }, [confirmation, postsResult, projectId])

    const handleRestorePost = useCallback(async (post: ProjectShowcasePost) => {
        if (!projectId) {
            return
        }

        const confirmed = await confirmation.confirm({
            content: (
                <p>
                    Are you sure you want to restore the archived post
                    {' '}
                    <strong>{post.title}</strong>
                    ?
                </p>
            ),
            title: 'Restore Post',
        })

        if (!confirmed) {
            return
        }

        setIsRestoring(true)

        try {
            await updateProjectShowcasePost(projectId, post.id, {
                status: 'DRAFT',
            })
            await postsResult.mutate()
            showSuccessToast('Post restored successfully')
        } catch (err) {
            showErrorToast(err instanceof Error ? err.message : 'Unable to restore post.')
        } finally {
            setIsRestoring(false)
        }
    }, [confirmation, postsResult, projectId])

    const handleArchivePost = useCallback(async (post: ProjectShowcasePost) => {
        if (!projectId) {
            return
        }

        const confirmed = await confirmation.confirm({
            content: (
                <p>
                    Are you sure you want to archive the post
                    {' '}
                    <strong>{post.title}</strong>
                    ?
                </p>
            ),
            title: 'Archive Post',
        })

        if (!confirmed) {
            return
        }

        try {
            await archiveProjectShowcasePost(projectId, post.id)
            await postsResult.mutate()
            showSuccessToast('Post archived successfully')
        } catch (err) {
            showErrorToast(err instanceof Error ? err.message : 'Unable to archive post.')
        }
    }, [confirmation, postsResult, projectId])

    const formMethods = useForm<ProjectShowcasePostFormData>({
        defaultValues: mapPostToFormData(),
        mode: 'all',
    })

    const {
        getValues,
        handleSubmit,
        reset,
        setError,
        setValue,
        watch,
    }: UseFormReturn<ProjectShowcasePostFormData, any, ProjectShowcasePostFormData> = formMethods

    const media = watch('media') || []

    const handleOpenMediaPicker = useCallback(() => {
        if (!projectId) {
            return
        }

        const currentMedia = getValues('media') || []
        if (currentMedia.length >= SHOWCASE_MEDIA_FILE_PICKER_MAX_FILES) {
            setMediaLimitWarning(`Maximum of ${SHOWCASE_MEDIA_FILE_PICKER_MAX_FILES} media files reached. Remove a file to add more.`)
            return
        }

        setMediaLimitWarning(undefined)

        const apiKey = EnvironmentConfig.FILESTACK.API_KEY
        if (!apiKey) {
            showErrorToast('Media uploads are not configured for this environment.')
            return
        }

        const uploadedMedia: Array<{ type: string; url: string }> = []
        const mediaStorePath = `project-showcase/${projectId}/`

        const pickerOptions: PickerOptions = {
            accept: SHOWCASE_MEDIA_FILE_PICKER_ACCEPT,
            fromSources: SHOWCASE_MEDIA_FILE_PICKER_FROM_SOURCES,
            maxFiles: SHOWCASE_MEDIA_FILE_PICKER_MAX_FILES,
            onClose: () => {
                setIsOpeningMediaPicker(false)
                if (!uploadedMedia.length) {
                    return
                }

                const existingMedia = getValues('media') || []
                const totalMediaCount = existingMedia.length + uploadedMedia.length
                setValue('media', [
                    ...existingMedia,
                    ...uploadedMedia,
                ].slice(0, SHOWCASE_MEDIA_FILE_PICKER_MAX_FILES))

                if (totalMediaCount > SHOWCASE_MEDIA_FILE_PICKER_MAX_FILES) {
                    setMediaLimitWarning(
                        `Maximum of ${SHOWCASE_MEDIA_FILE_PICKER_MAX_FILES} media files reached. Extra files were not added.`,
                    )
                }
            },
            onFileUploadFinished: file => {
                if (!file || !file.url) {
                    return
                }

                uploadedMedia.push({
                    type: String(file.mimetype || 'application/octet-stream'),
                    url: String(file.url),
                })
            },
            storeTo: {
                container: SHOWCASE_MEDIA_FILE_PICKER_CONTAINER,
                location: 's3',
                path: mediaStorePath,
                region: EnvironmentConfig.FILESTACK.REGION,
            },
            uploadInBackground: false,
        }

        const client = init(apiKey, {
            cname: EnvironmentConfig.FILESTACK.CNAME,
            security: EnvironmentConfig.FILESTACK.SECURITY
                ? {
                    policy: EnvironmentConfig.FILESTACK.SECURITY.POLICY,
                    signature: EnvironmentConfig.FILESTACK.SECURITY.SIGNATURE,
                }
                : undefined,
        })

        try {
            setIsOpeningMediaPicker(true)
            client.picker(pickerOptions)
                .open()
        } catch (uploadError) {
            setIsOpeningMediaPicker(false)
            showErrorToast(uploadError instanceof Error ? uploadError.message : 'Failed to open media picker.')
        }
    }, [getValues, projectId, setValue])

    const handleRemoveMedia = useCallback((index: number) => {
        const currentMedia = getValues('media') || []
        setValue('media', currentMedia.filter((_, itemIndex) => itemIndex !== index))
        if (mediaLimitWarning) {
            setMediaLimitWarning(undefined)
        }
    }, [getValues, mediaLimitWarning, setValue])

    useEffect(() => {
        if (media.length < SHOWCASE_MEDIA_FILE_PICKER_MAX_FILES && mediaLimitWarning) {
            setMediaLimitWarning(undefined)
        }
    }, [media.length, mediaLimitWarning])

    const handleResetFilters = useCallback(() => {
        setFilters({
            categoryId: undefined,
            industryId: undefined,
            keyword: undefined,
            status: undefined,
        })
        setKeywordInput('')
        setPage(1)
        setSortBy('updatedAt')
        setSortOrder('desc')
        setPerPage(DEFAULT_PER_PAGE)
    }, [])

    const handleRetry = useCallback(() => {
        postsResult
            .mutate()
            .catch(() => undefined)
        industriesResult
            .mutate()
            .catch(() => undefined)
        categoriesResult
            .mutate()
            .catch(() => undefined)
    }, [categoriesResult, industriesResult, postsResult])

    const formChallengeOptions = useMemo<FormSelectOption[]>((): FormSelectOption[] => (
        selectedChallengeOptions
    ), [selectedChallengeOptions])

    const mapChallengeFromFieldValue = useCallback(
        (value: unknown): FormSelectOption[] => {
            if (!Array.isArray(value)) {
                return []
            }

            return value
                .map(item => {
                    if (typeof item === 'string') {
                        return selectedChallengeOptions.find(option => option.value === item) || {
                            label: item,
                            value: item,
                        }
                    }

                    if (typeof item === 'object' && item && 'value' in item) {
                        return item as FormSelectOption
                    }

                    return undefined
                })
                .filter((option): option is FormSelectOption => !!option)
        },
        [selectedChallengeOptions],
    )

    const mapChallengeToFieldValue = useCallback(
        (selected: unknown): string[] => {
            if (!selected) {
                setSelectedChallengeOptions([])
                return []
            }

            const selectedOptions = Array.isArray(selected)
                ? selected as FormSelectOption[]
                : typeof selected === 'object' && selected && 'value' in selected
                    ? [selected as FormSelectOption]
                    : []

            setSelectedChallengeOptions(selectedOptions)
            return selectedOptions.map(option => option.value)
        },
        [],
    )

    const pageWrapperActions = useMemo(() => {
        if (!canManageProjectShowcasePosts) {
            return <></>
        }

        return (
            <Button
                label='Create Post'
                onClick={handleOpenCreateModal}
                primary
                size='md'
            />
        )
    }, [canManageProjectShowcasePosts, handleOpenCreateModal])

    useEffect(() => {
        if (!isManageModalOpen) {
            reset(mapPostToFormData())
            setSelectedChallengeOptions([])
            setFormError(undefined)
            setSelectedPostId(undefined)
            return
        }

        if (manageMode === 'create') {
            reset(mapPostToFormData())
            setSelectedChallengeOptions([])
            setFormError(undefined)
            setSelectedPostId(undefined)
            return
        }

        if (!selectedPostId || !projectId) {
            return
        }

        setIsLoadingPostDetails(true)
        fetchProjectShowcasePost(projectId, selectedPostId)
            .then(post => {
                setSelectedPostId(post.id)
                reset(mapPostToFormData(post))
                setFormError(undefined)

                const challengeIds = post.challengeIds || []
                if (challengeIds.length) {
                    Promise.all(challengeIds.map(challengeId => fetchChallenge(challengeId)))
                        .then(challenges => {
                            const challengeOptions = challenges.map(challenge => ({
                                label: challenge.name,
                                value: challenge.id,
                            }))

                            setSelectedChallengeOptions(challengeOptions)
                            setValue('challengeIds', challengeIds)
                        })
                        .catch(() => {
                            setSelectedChallengeOptions([])
                        })
                } else {
                    setSelectedChallengeOptions([])
                    setValue('challengeIds', [])
                }
            })
            .catch(err => {
                setFormError(err instanceof Error ? err.message : 'Unable to load post details.')
            })
            .finally(() => {
                setIsLoadingPostDetails(false)
            })
    }, [
        isManageModalOpen,
        manageMode,
        projectId,
        reset,
        selectedPostId,
        setValue,
    ])

    if (!hasProjectId) {
        return (
            <ProjectPageWrapper
                pageTitle='Showcase'
                breadCrumb={[]}
                rightHeader={pageWrapperActions}
                projectId={projectId as string}
            >
                <ErrorMessage message='Project id is required.' />
            </ProjectPageWrapper>
        )
    }

    return (
        <ProjectPageWrapper
            pageTitle='Showcase'
            breadCrumb={[]}
            headerActions={pageWrapperActions}
            projectId={projectId as string}
        >
            <div className={styles.container}>
                <ProjectsShowcaseFilter
                    keywordInput={keywordInput}
                    selectedStatus={selectedStatus}
                    selectedIndustry={selectedIndustry}
                    selectedCategory={selectedCategory}
                    industryOptions={industryOptions}
                    categoryOptions={categoryOptions}
                    isIndustriesLoading={industriesResult.isLoading}
                    isCategoriesLoading={categoriesResult.isLoading}
                    onSearchInputChange={handleSearchInputChange}
                    onStatusChange={handleStatusChange}
                    onIndustryChange={handleIndustryChange}
                    onCategoryChange={handleCategoryChange}
                    onResetFilters={handleResetFilters}
                />

                {error && (
                    <div className={styles.errorBanner}>
                        <ErrorMessage
                            message={error.message}
                            onRetry={handleRetry}
                        />
                    </div>
                )}

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>
                                    <button
                                        type='button'
                                        className={styles.sortButton}
                                        data-field-name='title'
                                        onClick={handleSortByTitle}
                                    >
                                        Title
                                        {getSortIndicator(sortBy, sortOrder, 'title')}
                                    </button>
                                </th>
                                <th>Status</th>
                                <th>Created Date</th>
                                <th>Creator</th>
                                <th>
                                    <button
                                        type='button'
                                        className={styles.sortButton}
                                        data-field-name='industry'
                                        onClick={handleSortByIndustry}
                                    >
                                        Industry
                                        {getSortIndicator(sortBy, sortOrder, 'industry')}
                                    </button>
                                </th>
                                <th>
                                    <button
                                        type='button'
                                        className={styles.sortButton}
                                        data-field-name='category'
                                        onClick={handleSortByCategory}
                                    >
                                        Category
                                        {getSortIndicator(sortBy, sortOrder, 'category')}
                                    </button>
                                </th>
                                <th>
                                    {canManageProjectShowcasePosts ? 'Actions' : ''}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && filteredPosts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className={styles.loadingRow}>
                                        <LoadingSpinner inline />
                                    </td>
                                </tr>
                            )}

                            {!isLoading && filteredPosts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className={styles.emptyRow}>
                                        No showcase posts found.
                                    </td>
                                </tr>
                            )}

                            {!isLoading && filteredPosts.map(post => (
                                <tr key={post.id}>
                                    <td>{post.title || '—'}</td>
                                    <td>
                                        <span className={
                                            classNames(styles.statusPill, getStatusPillClass(post.status))
                                        }
                                        >
                                            {getStatusLabel(post.status)}
                                        </span>
                                    </td>
                                    <td>{formatDate(post.createdAt)}</td>
                                    <td>{post.createdByHandle || '—'}</td>
                                    <td>
                                        {post.industries
                                            .map(item => item.name)
                                            .join(', ') || '—'}
                                    </td>
                                    <td>
                                        {post.categories
                                            .map(item => item.name)
                                            .join(', ') || '—'}
                                    </td>
                                    <td className={styles.rowActions}>
                                        {canManageProjectShowcasePosts && (
                                            <>
                                                {post.status !== 'ARCHIVED' && (
                                                    <button
                                                        type='button'
                                                        className={styles.actionButton}
                                                        onClick={function onClick() { handleEditPost(post.id) }}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {post.status === 'DRAFT' && (
                                                    <button
                                                        type='button'
                                                        className={styles.actionButton}
                                                        disabled={isPublishing}
                                                        onClick={function onClick() { handlePublishPost(post) }}
                                                    >
                                                        Publish
                                                    </button>
                                                )}
                                                {post.status === 'PUBLISHED' && (
                                                    <button
                                                        type='button'
                                                        className={styles.actionButton}
                                                        disabled={isUnpublishing}
                                                        onClick={function onClick() { handleUnpublishPost(post) }}
                                                    >
                                                        Unpublish
                                                    </button>
                                                )}
                                                {(post.status === 'ARCHIVED' ? (
                                                    <button
                                                        type='button'
                                                        className={styles.actionButton}
                                                        disabled={isRestoring}
                                                        onClick={function onClick() { handleRestorePost(post) }}
                                                    >
                                                        Restore
                                                    </button>
                                                ) : (
                                                    <button
                                                        type='button'
                                                        className={classNames(styles.actionButton, styles.actionDelete)}
                                                        onClick={function onClick() { handleArchivePost(post) }}
                                                    >
                                                        Archive
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {shouldShowPagination && (
                    <Pagination
                        page={postsResult.metadata.page ?? page}
                        perPage={postsResult.metadata.perPage ?? perPage}
                        total={totalPosts}
                        itemLabel='posts'
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                )}
            </div>

            <BaseModal
                open={isManageModalOpen}
                title={manageMode === 'create' ? 'Create Post' : 'Edit Post'}
                onClose={function onClose() {
                    setSelectedPostId(undefined)
                    setIsManageModalOpen(false)
                    setFormError(undefined)
                }}
                size='body'
            >
                <FormProvider {...formMethods}>
                    <form
                        className={styles.modalForm}
                        onSubmit={handleSubmit(async data => {
                            if (!projectId) {
                                return
                            }

                            setFormError(undefined)
                            setIsSaving(true)

                            if (!data.title.trim()) {
                                setError('title', { message: 'Title is required.', type: 'required' })
                            }

                            if (!data.content.trim()) {
                                setError('content', { message: 'Content is required.', type: 'required' })
                            }

                            if (!data.industryIds.length) {
                                setError('industryIds', { message: 'Select at least one industry.', type: 'required' })
                            }

                            if (!data.categoryIds.length) {
                                setError('categoryIds', { message: 'Select at least one category.', type: 'required' })
                            }

                            if (
                                !data.title.trim()
                                || !data.content.trim()
                                || !data.industryIds.length
                                || !data.categoryIds.length
                            ) {
                                setIsSaving(false)
                                return
                            }

                            try {
                                const resolvedIndustryIds = await resolveTaxonomyIds(
                                    data.industryIds,
                                    industryOptions,
                                    createProjectShowcasePostIndustry,
                                )
                                const resolvedCategoryIds = await resolveTaxonomyIds(
                                    data.categoryIds,
                                    categoryOptions,
                                    createProjectShowcasePostCategory,
                                )

                                if (manageMode === 'create') {
                                    await createProjectShowcasePost(projectId, {
                                        categoryIds: resolvedCategoryIds,
                                        challengeIds: data.challengeIds,
                                        content: data.content.trim(),
                                        industryIds: resolvedIndustryIds,
                                        media: data.media,
                                        title: data.title.trim(),
                                    })
                                    setIsManageModalOpen(false)
                                    await Promise.all([
                                        postsResult.mutate(),
                                        industriesResult.mutate(),
                                        categoriesResult.mutate(),
                                    ])
                                    showSuccessToast('Post created successfully')
                                } else if (selectedPostId) {
                                    await updateProjectShowcasePost(projectId, selectedPostId, {
                                        categoryIds: resolvedCategoryIds,
                                        challengeIds: data.challengeIds,
                                        content: data.content.trim(),
                                        industryIds: resolvedIndustryIds,
                                        media: data.media,
                                        title: data.title.trim(),
                                    })
                                    setIsManageModalOpen(false)
                                    await Promise.all([
                                        postsResult.mutate(),
                                        industriesResult.mutate(),
                                        categoriesResult.mutate(),
                                    ])
                                    showSuccessToast('Post updated successfully')
                                }
                            } catch (err) {
                                const message = err instanceof Error
                                    ? err.message
                                    : 'Unable to save post.'
                                setFormError(message)
                            } finally {
                                setIsSaving(false)
                            }
                        })}
                    >
                        <div className={styles.modalBody}>
                            {formError && (
                                <div className={styles.modalError}>
                                    <ErrorMessage message={formError} />
                                </div>
                            )}

                            <div className={styles.modalField}>
                                <FormTextField
                                    label='Title'
                                    name='title'
                                    placeholder='Enter title for the post'
                                    required
                                />
                            </div>

                            <div className={styles.modalField}>
                                <FormMarkdownEditor
                                    label='Content'
                                    name='content'
                                    required
                                />
                            </div>

                            <div className={styles.modalField}>
                                <FormSelectField
                                    label='Industries'
                                    name='industryIds'
                                    options={industryOptions.slice(1)}
                                    isMulti
                                    isCreatable={isAdminUser}
                                    isClearable
                                    required
                                />
                            </div>

                            <div className={styles.modalField}>
                                <FormSelectField
                                    label='Categories'
                                    name='categoryIds'
                                    options={categoryOptions.slice(1)}
                                    isMulti
                                    isCreatable={isAdminUser}
                                    isClearable
                                    required
                                />
                            </div>

                            <div className={styles.modalField}>
                                <div className={styles.mediaSectionHeader}>
                                    <span className={styles.mediaSectionLabel}>Post media</span>
                                    <Button
                                        label='Add media'
                                        onClick={handleOpenMediaPicker}
                                        size='sm'
                                        type='button'
                                        disabled={isOpeningMediaPicker}
                                    />
                                </div>

                                {media.length > 0 ? (
                                    <div className={styles.mediaList}>
                                        {media.map((item, index) => (
                                            <div key={`${item.url}`} className={styles.mediaItem}>
                                                {item.type.startsWith('image/') ? (
                                                    <img
                                                        src={item.url}
                                                        alt={`Post media preview ${index + 1}`}
                                                        className={styles.mediaPreview}
                                                    />
                                                ) : (
                                                    <div className={styles.mediaPreviewPlaceholder}>
                                                        {item.type?.split('/').join(' ') || 'FILE'}
                                                    </div>
                                                )}
                                                <div className={styles.mediaDetails}>
                                                    <a
                                                        href={item.url}
                                                        target='_blank'
                                                        rel='noreferrer noopener'
                                                        className={styles.mediaLink}
                                                    >
                                                        {item.url}
                                                    </a>
                                                    <button
                                                        type='button'
                                                        className={styles.mediaRemoveButton}
                                                        onClick={function onClick() { handleRemoveMedia(index) }}
                                                        aria-label={`Remove media ${index + 1}`}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.mediaEmpty}>No media added yet.</div>
                                )}
                                {mediaLimitWarning && (
                                    <div className={styles.mediaWarning} role='alert'>
                                        {mediaLimitWarning}
                                    </div>
                                )}
                            </div>

                            <div className={styles.modalField}>
                                <FormSelectField
                                    label='Challenge'
                                    name='challengeIds'
                                    isAsync
                                    isMulti
                                    isClearable
                                    fromFieldValue={mapChallengeFromFieldValue}
                                    toFieldValue={mapChallengeToFieldValue}
                                    loadOptions={function loadOptions(inputValue: string) {
                                        return loadProjectChallenges(projectId ?? '', inputValue)
                                    }}
                                    options={formChallengeOptions}
                                    placeholder='Select a challenge'
                                />
                            </div>
                        </div>

                        <footer className={styles.modalFooter}>
                            <Button
                                label='Cancel'
                                onClick={function onClick() {
                                    setIsManageModalOpen(false)
                                    setFormError(undefined)
                                }}
                                secondary
                                size='lg'
                                type='button'
                            />
                            <Button
                                label={manageMode === 'create' ? 'Create' : 'Save'}
                                primary
                                size='lg'
                                type='submit'
                                disabled={isSaving || isLoadingPostDetails}
                            />
                        </footer>
                    </form>
                </FormProvider>
            </BaseModal>

            {confirmation.modal}
        </ProjectPageWrapper>
    )
}

export default ProjectShowcasePage
