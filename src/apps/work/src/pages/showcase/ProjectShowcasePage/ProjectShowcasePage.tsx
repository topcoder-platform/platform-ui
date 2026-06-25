import { PageWrapper } from '~/apps/review/src/lib'
import {
    Button,
    IconOutline,
    LoadingSpinner,
} from '~/libs/ui'
import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useParams } from 'react-router-dom'
import Select, { SingleValue } from 'react-select'
import {
    ErrorMessage,
    Pagination,
    ProjectListTabs,
    ProjectsShowcaseFilter,
} from '../../../lib/components'
import {
    useFetchProjectShowcasePostCategories,
    useFetchProjectShowcasePostIndustries,
    useFetchProjectShowcasePosts,
} from '../../../lib/hooks'

import type {
    FetchProjectShowcasePostsParams,
    ProjectShowcasePost,
    ProjectShowcasePostCategory,
    ProjectShowcasePostFilters,
    ProjectShowcasePostIndustry,
} from '../../../lib/models'

import styles from './ProjectShowcasePage.module.scss'
import classNames from 'classnames'

interface SelectOption {
    label: string
    value: string
}

const DEFAULT_FILTERS: ProjectShowcasePostFilters = {
    categoryId: undefined,
    industryId: undefined,
    keyword: undefined,
    status: undefined,
}

const STATUS_OPTIONS: SelectOption[] = [
    { label: 'All statuses', value: '' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Published', value: 'PUBLISHED' },
    { label: 'Archived', value: 'ARCHIVED' },
]

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

function createTaxonomyOptions(
    items: Array<ProjectShowcasePostCategory | ProjectShowcasePostIndustry>,
    defaultLabel: string,
): SelectOption[] {
    return [
        { label: defaultLabel, value: '' },
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
    const [perPage, setPerPage] = useState<number>(10)
    const [sortBy, setSortBy] = useState<string>('updatedAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    const isFirstDebouncedRender = useRef<boolean>(true)

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
        () => createTaxonomyOptions(industriesResult.items, 'All industries'),
        [industriesResult.items],
    )

    const categoryOptions = useMemo<SelectOption[]>(
        () => createTaxonomyOptions(categoriesResult.items, 'All categories'),
        [categoriesResult.items],
    )

    const selectedStatus = findSelectedOption(STATUS_OPTIONS, filters.status)
    const selectedIndustry = findSelectedOption(industryOptions, filters.industryId)
    const selectedCategory = findSelectedOption(categoryOptions, filters.categoryId)

    const filteredPosts = useMemo(
        () => sortProjectShowcasePosts(postsResult.posts, sortBy, sortOrder),
        [postsResult.posts, sortBy, sortOrder],
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

    if (!hasProjectId) {
        return (
            <PageWrapper pageTitle='Showcase' breadCrumb={[]}>
                <ErrorMessage message='Project id is required.' />
            </PageWrapper>
        )
    }

    return (
        <PageWrapper pageTitle='Showcase' breadCrumb={[]}>
            <ProjectListTabs projectId={projectId as string} />
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
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && filteredPosts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className={styles.loadingRow}>
                                        <LoadingSpinner inline />
                                    </td>
                                </tr>
                            )}

                            {!isLoading && filteredPosts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className={styles.emptyRow}>
                                        No showcase posts found.
                                    </td>
                                </tr>
                            )}

                            {!isLoading && filteredPosts.map(post => (
                                <tr key={post.id}>
                                            <td>{post.title || '—'}</td>
                                    <td>
                                        <span className={classNames(styles.statusPill, getStatusPillClass(post.status))}>
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
        </PageWrapper>
    )
}

export default ProjectShowcasePage
