/* eslint-disable complexity */
import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useSWRConfig } from 'swr'
import type { FullConfiguration } from 'swr/dist/types'
import classNames from 'classnames'

import {
    Button,
    IconOutline,
    InputMultiselect,
    InputMultiselectOption,
    InputSelect,
    InputText,
    LoadingSpinner,
} from '~/libs/ui'
import {
    fetchProjectShowcasePosts,
    FetchProjectShowcasePostsParams,
    ProjectShowcasePostCategory,
    ProjectShowcasePostIndustry,
    useFetchProjectShowcasePostCategories,
    useFetchProjectShowcasePostIndustries,
    useFetchProjectShowcasePosts,
    UseFetchProjectShowcasePostsResult,
} from '~/apps/work/src/lib'

import { PageWrapper } from '../../../lib/components'
import { ProjectShowcaseCard } from '../ProjectShowcaseCard'

import styles from './ProjectShowcasePage.module.scss'

const PAGE_SIZE = 12

const sortOptions = [
    { label: 'Newest', value: 'desc' },
    { label: 'Oldest', value: 'asc' },
]

function normalizeTaxonomyOption(
    item: ProjectShowcasePostCategory | ProjectShowcasePostIndustry,
): {label: string; value: string} {
    return { label: item.name, value: item.id }
}

function createTaxonomyOptions(items: Array<ProjectShowcasePostCategory | ProjectShowcasePostIndustry>): {
    label: string;
    value: string;
}[] {
    return items.map(normalizeTaxonomyOption)
}

const ProjectShowcasePage: FC = () => {
    const [keyword, setKeyword] = useState('')
    const [selectedIndustries, setSelectedIndustries] = useState<InputMultiselectOption[]>([])
    const [selectedCategories, setSelectedCategories] = useState<InputMultiselectOption[]>([])
    const [page, setPage] = useState(1)
    const sortBy = 'createdAt'
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const hasFiltersApplied = useMemo(() => (
        !!keyword.trim() || selectedIndustries.length > 0 || selectedCategories.length > 0
    ), [keyword, selectedIndustries, selectedCategories])

    const industriesResult = useFetchProjectShowcasePostIndustries()
    const categoriesResult = useFetchProjectShowcasePostCategories()

    const filters: FetchProjectShowcasePostsParams = useMemo<FetchProjectShowcasePostsParams>(() => ({
        categoryId: selectedCategories.map(option => String(option.value || ''))
            .filter(Boolean)
            .join(','),
        industryId: selectedIndustries.map(option => String(option.value || ''))
            .filter(Boolean)
            .join(','),
        status: 'PUBLISHED',
        keyword: keyword.trim() || undefined,
        page,
        perPage: PAGE_SIZE,
        projectId: '',
        sortBy,
        sortOrder,
    }), [keyword, selectedIndustries, selectedCategories, page, sortOrder])

    const postsResult: UseFetchProjectShowcasePostsResult = useFetchProjectShowcasePosts(filters)
    const { mutate }: FullConfiguration = useSWRConfig()

    const industryOptions = useMemo(
        () => createTaxonomyOptions(industriesResult.items),
        [industriesResult.items],
    )

    const categoryOptions = useMemo(
        () => createTaxonomyOptions(categoriesResult.items),
        [categoriesResult.items],
    )

    const loadMoreDisabled = postsResult.posts.length >= (postsResult.metadata.total || 0)

    useEffect(() => {
        setPage(1)
    }, [keyword, selectedIndustries, selectedCategories, sortOrder])

    const handleKeywordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setKeyword(event.target.value)
    }, [])

    const handleIndustriesChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value as unknown
        setSelectedIndustries(Array.isArray(value) ? value as InputMultiselectOption[] : [])
    }, [])

    const handleCategoriesChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value as unknown
        setSelectedCategories(Array.isArray(value) ? value as InputMultiselectOption[] : [])
    }, [])

    const handleSortOrderChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSortOrder(event.target.value as 'asc' | 'desc')
    }, [])

    const handleClearFilters = useCallback(() => {
        setKeyword('')
        setSelectedIndustries([])
        setSelectedCategories([])
        setPage(1)
    }, [])

    const handleLoadMore = useCallback(async () => {
        if (loadMoreDisabled) {
            return
        }

        const nextPage = page + 1
        setPage(nextPage)

        const response = await fetchProjectShowcasePosts({ ...filters, page: nextPage })
        await mutate([
            'work/project-showcase-posts',
            filters.projectId || '',
            filters.keyword || '',
            '',
            filters.industryId || '',
            filters.categoryId || '',
            String(nextPage),
            String(filters.perPage || PAGE_SIZE),
            filters.sortBy || '',
            filters.sortOrder || '',
        ], {
            metadata: response.metadata,
            posts: [...postsResult.posts, ...response.posts],
        }, false)
    }, [filters, loadMoreDisabled, mutate, page, postsResult.posts])

    return (
        <PageWrapper
            pageTitle=''
            backUrl=''
            breadCrumb={[]}
            introText='Loading customer stories...'
            sidebar={(
                <>
                    <div className={styles.sidebarTitle}>
                        Search Showcases
                    </div>
                    <hr />

                    <div className={styles.searchInputWrapper}>
                        <InputText
                            forceUpdateValue
                            classNameWrapper={styles.searchInput}
                            label={' '}
                            placeholder='Search by project or description'
                            name='jobDescription'
                            value={keyword}
                            onChange={handleKeywordChange}
                            type='text'
                        />
                        <IconOutline.SearchIcon className={classNames('icon-lg', styles.searchIcon)} />
                    </div>
                    <div className={classNames(styles.sidebarTitle, styles.filterTitle)}>
                        Filter
                    </div>
                    <InputMultiselect
                        name='industry'
                        label='Industry'
                        options={industryOptions}
                        value={selectedIndustries}
                        onChange={handleIndustriesChange}
                        placeholder='All Industries'
                        className={styles.input}
                        openMenuOnClick
                    />
                    <InputMultiselect
                        name='category'
                        label='Category'
                        options={categoryOptions}
                        value={selectedCategories}
                        onChange={handleCategoriesChange}
                        placeholder='All Categories'
                        className={styles.input}
                        openMenuOnClick
                    />

                    <div>
                        <Button
                            size='lg'
                            label='Clear filters'
                            secondary
                            onClick={handleClearFilters}
                        />
                    </div>
                </>
            )}
        >
            <div className={styles.pageContainer}>
                <div className={styles.topbarContainer}>
                    <div className={styles.resultsMeta}>
                        {postsResult.posts.length > 0 && !postsResult.isLoading && (
                            <span>
                                {hasFiltersApplied ? 'We have found' : ''}
                                {' '}
                                <strong>
                                    {postsResult.metadata.total}
                                    {' '}
                                    {!hasFiltersApplied && 'total'}
                                    {hasFiltersApplied && (
                                        postsResult.metadata.total === 1 ? 'showcase' : 'showcases'
                                    )}
                                </strong>
                                {' '}
                                <span>
                                    {hasFiltersApplied ? 'that match your search.' : 'showcases'}
                                </span>
                            </span>
                        )}
                    </div>

                    <label className={styles.sorting}>
                        <span>Sort by:</span>
                        <InputSelect
                            name='sortOrder'
                            options={sortOptions}
                            value={sortOrder}
                            onChange={handleSortOrderChange}
                            placeholder='Sort by'
                            classNameWrapper={styles.sortSelect}
                        />
                    </label>
                </div>

                <section className={styles.results}>
                    {!postsResult.posts.length && !postsResult.isLoading && (
                        <div className={styles.emptyState}>
                            No showcase posts match your search.
                        </div>
                    )}

                    {postsResult.posts.length > 0 && (
                        <div className={styles.grid}>
                            {postsResult.posts.map(post => (
                                <ProjectShowcaseCard post={post} key={post.id} />
                            ))}
                        </div>
                    )}

                    {postsResult.isLoading && (
                        <div className={styles.loadingRow}>
                            <LoadingSpinner inline />
                        </div>
                    )}

                    {!loadMoreDisabled && postsResult.posts.length > 0 && (
                        <div className={styles.loadMoreWrapper}>
                            <Button
                                label='Load more showcases'
                                onClick={handleLoadMore}
                                disabled={postsResult.isLoading || loadMoreDisabled}
                                secondary
                            />
                        </div>
                    )}
                </section>
            </div>
        </PageWrapper>
    )
}

export default ProjectShowcasePage
