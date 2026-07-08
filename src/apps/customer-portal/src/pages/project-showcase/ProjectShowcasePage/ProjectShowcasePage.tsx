import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useSWRConfig } from 'swr'

import { Button, IconOutline, InputMultiselect, InputMultiselectOption, InputSelect, InputText, LoadingSpinner } from '~/libs/ui'
import { PageWrapper } from '../../../lib/components'
import { useFetchProjectShowcasePostCategories, useFetchProjectShowcasePostIndustries, useFetchProjectShowcasePosts } from '~/apps/work/src/lib/hooks'
import { fetchProjectShowcasePosts } from '~/apps/work/src/lib/services'
import type {
    FetchProjectShowcasePostsParams,
    ProjectShowcasePost,
    ProjectShowcasePostCategory,
    ProjectShowcasePostIndustry,
} from '~/apps/work/src/lib/models'

import styles from './ProjectShowcasePage.module.scss'
import classNames from 'classnames'

const PAGE_SIZE = 12

const sortOptions = [
    { label: 'Newest', value: 'desc' },
    { label: 'Oldest', value: 'asc' },
]

function normalizeTaxonomyOption(item: ProjectShowcasePostCategory | ProjectShowcasePostIndustry) {
    return { label: item.name, value: item.id }
}

function createTaxonomyOptions(items: Array<ProjectShowcasePostCategory | ProjectShowcasePostIndustry>) {
    return items.map(normalizeTaxonomyOption)
}

const ProjectShowcasePage: FC = () => {
    const [keyword, setKeyword] = useState('')
    const [selectedIndustries, setSelectedIndustries] = useState<InputMultiselectOption[]>([])
    const [selectedCategories, setSelectedCategories] = useState<InputMultiselectOption[]>([])
    const [page, setPage] = useState(1)
    const sortBy = 'createdAt'
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    const industriesResult = useFetchProjectShowcasePostIndustries()
    const categoriesResult = useFetchProjectShowcasePostCategories()

    const filters = useMemo<FetchProjectShowcasePostsParams>(() => ({
        projectId: '',
        page,
        perPage: PAGE_SIZE,
        keyword: keyword.trim() || undefined,
        industryId: selectedIndustries.map(option => String(option.value || '')).filter(Boolean).join(','),
        categoryId: selectedCategories.map(option => String(option.value || '')).filter(Boolean).join(','),
        sortBy,
        sortOrder,
    }), [keyword, selectedIndustries, selectedCategories, page, sortOrder])

    const postsResult = useFetchProjectShowcasePosts(filters)
    const { mutate } = useSWRConfig()

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

    const content = useMemo(() => {
        if (!postsResult.posts.length && !postsResult.isLoading) {
            return (
                <div className={styles.emptyState}>
                    No showcase posts match your search.
                </div>
            )
        }

        return (
            <>
                <div className={styles.grid}>
                    {postsResult.posts.map(post => (
                        <article key={post.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3>{post.title || 'Untitled'}</h3>
                                <span className={styles.cardDate}>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.taxonomy}>
                                    <strong>Industry:</strong>
                                    <span>{post.industries.map(item => item.name).join(', ') || '—'}</span>
                                </div>
                                <div className={styles.taxonomy}>
                                    <strong>Category:</strong>
                                    <span>{post.categories.map(item => item.name).join(', ') || '—'}</span>
                                </div>
                            </div>
                            <div className={styles.cardFooter}>
                                <span>{post.createdByHandle || 'Unknown author'}</span>
                            </div>
                        </article>
                    ))}
                </div>
                {postsResult.isLoading && (
                    <div className={styles.loadingRow}>
                        <LoadingSpinner inline />
                    </div>
                )}
            </>
        )
    }, [postsResult.isLoading, postsResult.posts])

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
                    />
                    <InputMultiselect
                        name='category'
                        label='Category'
                        options={categoryOptions}
                        value={selectedCategories}
                        onChange={handleCategoriesChange}
                        placeholder='All Categories'
                        className={styles.input}
                    />
                </>
            )}
        >
            <div className={styles.pageContainer}>
                <div className={styles.topbarContainer}>
                    <div className={styles.resultsMeta}>
                        {postsResult.posts.length > 0 && !postsResult.isLoading && (
                            <span>
                                <strong>{postsResult.metadata.total} total</strong>
                                {' '}
                                <span>showcases</span>
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
                                <article key={post.id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <h3>{post.title || 'Untitled'}</h3>
                                        <span className={styles.cardDate}>{new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <div className={styles.taxonomy}>
                                            <strong>Industry:</strong>
                                            <span>{post.industries.map(item => item.name).join(', ') || '—'}</span>
                                        </div>
                                        <div className={styles.taxonomy}>
                                            <strong>Category:</strong>
                                            <span>{post.categories.map(item => item.name).join(', ') || '—'}</span>
                                        </div>
                                    </div>
                                    <div className={styles.cardFooter}>
                                        <span>{post.createdByHandle || 'Unknown author'}</span>
                                    </div>
                                </article>
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
                                label='Load more'
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
