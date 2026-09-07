/**
 * What the vector index currently holds, one row per challenge (the index
 * itself stores one row per chunk — the API aggregates).
 *
 * Filtering, searching and pagination are all server-side: the index can hold
 * far more than is reasonable to ship to the browser at once.
 */
import { ChangeEvent, FC, MouseEventHandler, useCallback, useEffect, useMemo, useState } from 'react'
import { debounce } from 'lodash'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { EnvironmentConfig } from '~/config'
import { useWindowSize, WindowSize } from '~/libs/shared'
import {
    Button,
    IconOutline,
    InputSelect,
    InputSelectOption,
    InputWrapper,
    Table,
    TableColumn,
} from '~/libs/ui'

import { ConfirmModal, Pagination, TableLoading, TableNoRecord } from '../../lib'
import { TableMobile } from '../../lib/components/common/TableMobile'
import { TableWrapper } from '../../lib/components/common/TableWrapper'
import { MobileTableColumn } from '../../lib/models'
import {
    deleteIndexedChallenge,
    fetchIndexedChallenges,
    IndexedChallenge,
} from '../../lib/services/rag-index.service'

import styles from './IndexedChallengesPanel.module.scss'

const stopPropagation: MouseEventHandler = ev => ev.stopPropagation()

const PER_PAGE = 10

const TRACK_OPTIONS: InputSelectOption[] = [
    { label: 'All tracks', value: '' },
    { label: 'Development', value: 'Development' },
    { label: 'Design', value: 'Design' },
    { label: 'Data Science', value: 'Data Science' },
    { label: 'Quality Assurance', value: 'Quality Assurance' },
]

const TYPE_OPTIONS: InputSelectOption[] = [
    { label: 'All types', value: '' },
    { label: 'Challenge', value: 'Challenge' },
    { label: 'First2Finish', value: 'First2Finish' },
    { label: 'Marathon Match', value: 'Marathon Match' },
    { label: 'Task', value: 'Task' },
]

interface Filters {
    search: string
    projectId: string
    track: string
    type: string
}

const EMPTY_FILTERS: Filters = { projectId: '', search: '', track: '', type: '' }

/**
 * Review app's challenge details page.
 *
 * `/review/challenges/:challengeId` is the app's own status-agnostic entry
 * point — it `Rewrite`s to `/active-challenges/:challengeId/challenge-details`
 * (see review-app.routes.tsx). Linking through it rather than hard-coding that
 * target matters here because the index holds completed challenges as well as
 * active ones, and the chunk metadata carries no status to choose between the
 * review app's active/past modules.
 */
function buildChallengeDetailsUrl(challengeId: string): string {
    return `${EnvironmentConfig.REVIEW_APP_URL}/challenges/${encodeURIComponent(challengeId)}`
}

/**
 * Work Manager's project page. `/projects/:projectId` is the work app's own
 * entry point for a project (it rewrites to the project's challenges tab), and
 * WORK_MANAGER_URL is how the admin app already links into it elsewhere —
 * see ChallengeList.tsx.
 */
function buildProjectDetailsUrl(projectId: string): string {
    return `${EnvironmentConfig.ADMIN.WORK_MANAGER_URL}/projects/${encodeURIComponent(projectId)}`
}

function formatIngestedAt(value: string | null): string {
    if (!value) {
        return '—'
    }

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
        return value
    }

    return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

interface IndexedChallengesPanelProps {
    /** Bumped by the parent after an ingestion run, to force a refetch. */
    refreshToken: number
}

export const IndexedChallengesPanel: FC<IndexedChallengesPanelProps> = props => {
    const [challenges, setChallenges] = useState<IndexedChallenge[]>([])
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [page, setPage] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
    const [searchInput, setSearchInput] = useState('')
    const [loadError, setLoadError] = useState<string | undefined>()
    const [confirmDelete, setConfirmDelete] = useState<IndexedChallenge | undefined>()

    const { width: screenWidth }: WindowSize = useWindowSize()
    const isMobile = useMemo(() => screenWidth <= 1050, [screenWidth])

    const load = useCallback(async () => {
        setIsLoading(true)
        setLoadError(undefined)

        try {
            const response = await fetchIndexedChallenges({
                page,
                perPage: PER_PAGE,
                projectId: filters.projectId,
                search: filters.search,
                track: filters.track,
                type: filters.type,
            })

            setChallenges(response.data ?? [])
            setTotal(response.total)
            setTotalPages(response.totalPages)
        } catch (error) {
            setChallenges([])
            setTotal(0)
            setTotalPages(0)
            setLoadError(
                error instanceof Error ? error.message : 'Failed to load indexed challenges',
            )
        } finally {
            setIsLoading(false)
        }
    }, [filters, page])

    useEffect(() => {
        load()
    }, [load, props.refreshToken])

    const debouncedSearch = useMemo(() => debounce((value: string) => {
        setPage(1)
        setFilters(previous => ({ ...previous, search: value }))
    }, 400), [])

    useEffect(() => () => {
     debouncedSearch.cancel()
 }, [debouncedSearch])

    const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const value: string = event.target.value
        setSearchInput(value)
        debouncedSearch(value)
    }, [debouncedSearch])

    const handleFilterChange = useCallback((field: keyof Filters) => (
        (event: ChangeEvent<HTMLInputElement>) => {
            const value: string = event.target.value
            setPage(1)
            setFilters(previous => ({ ...previous, [field]: value }))
        }
    ), [])

    const handleClearFilters = useCallback(() => {
        debouncedSearch.cancel()
        setSearchInput('')
        setFilters(EMPTY_FILTERS)
        setPage(1)
    }, [debouncedSearch])

    const handlePageChange = useCallback((nextPage: number) => {
        setPage(nextPage)
    }, [])

    const handleCloseConfirm = useCallback(() => {
        setConfirmDelete(undefined)
    }, [])

    const handleConfirmDelete = useCallback(async () => {
        if (!confirmDelete) {
            return
        }

        setIsDeleting(true)
        try {
            const result = await deleteIndexedChallenge(confirmDelete.challengeId)
            toast.success(`Removed ${result.deletedChunks} chunk(s) from the index`)

            // Step back a page when the last row of the last page goes,
            // otherwise the operator lands on an empty page.
            if (challenges.length === 1 && page > 1) {
                setPage(page - 1)
            } else {
                await load()
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to remove challenge')
        } finally {
            setIsDeleting(false)
            setConfirmDelete(undefined)
        }
    }, [challenges.length, confirmDelete, load, page])

    const hasFilters = useMemo(
        () => Object.values(filters)
            .some(value => !!value),
        [filters],
    )

    const columns = useMemo<TableColumn<IndexedChallenge>[]>(() => [
        {
            label: 'Challenge',
            propertyName: 'name',
            renderer: (data: IndexedChallenge) => (
                <div className={styles.challengeCell} title={data.challengeId}>
                    <a
                        className={styles.challengeName}
                        href={buildChallengeDetailsUrl(data.challengeId)}
                        target='_blank'
                        rel='noreferrer'
                        onClick={stopPropagation}
                    >
                        {data.name || data.challengeId}
                    </a>
                </div>
            ),
            type: 'element',
        },
        {
            label: 'Type',
            propertyName: 'type',
            renderer: (data: IndexedChallenge) => (
                <span className={styles.typeChip}>{data.type || '—'}</span>
            ),
            type: 'element',
        },
        {
            label: 'Track',
            propertyName: 'track',
            renderer: (data: IndexedChallenge) => (
                data.track
                    ? (
                        <span
                            className={classNames(
                                styles.trackChip,
                                styles[`track-${data.track.replace(/\s+/g, '-')
                                    .toLowerCase()}`],
                            )}
                        >
                            {data.track.toUpperCase()}
                        </span>
                    )
                    : <span>—</span>
            ),
            type: 'element',
        },
        {
            label: 'Project',
            propertyName: 'projectId',
            renderer: (data: IndexedChallenge) => (
                data.projectId
                    ? (
                        <a
                            className={styles.projectLink}
                            href={buildProjectDetailsUrl(data.projectId)}
                            target='_blank'
                            rel='noreferrer'
                            onClick={stopPropagation}
                        >
                            {data.projectId}
                        </a>
                    )
                    // projectId is nullable in the chunk metadata — an opaque
                    // reference that ingestion carries through but never
                    // requires (ADR 0001, D10).
                    : <span>—</span>
            ),
            type: 'element',
        },
        {
            label: 'Chunks',
            propertyName: 'chunks',
            renderer: (data: IndexedChallenge) => (
                <span className={styles.chunksCell}>{data.chunks}</span>
            ),
            type: 'element',
        },
        {
            label: 'Ingested At',
            propertyName: 'ingestedAt',
            renderer: (data: IndexedChallenge) => <span>{formatIngestedAt(data.ingestedAt)}</span>,
            type: 'element',
        },
        {
            label: '',
            propertyName: 'actions',
            renderer: (data: IndexedChallenge) => {
                function onDeleteClick(event: React.MouseEvent): void {
                    event.stopPropagation()
                    setConfirmDelete(data)
                }

                return (
                    <button
                        type='button'
                        className={styles.deleteButton}
                        onClick={onDeleteClick}
                        aria-label={`Remove ${data.name || data.challengeId} from the index`}
                    >
                        <IconOutline.TrashIcon className='icon-md' />
                    </button>
                )
            },
            type: 'element',
        },
    ], [])

    const columnsMobile = useMemo<MobileTableColumn<IndexedChallenge>[][]>(
        () => columns.map(column => [
            {
                ...column,
                className: '',
                label: `${column.label as string} label`,
                mobileType: 'label',
                renderer: () => (
                    <div>
                        {column.label as string}
                        :
                    </div>
                ),
                type: 'element',
            },
            {
                ...column,
                mobileType: 'last-value',
            },
        ]),
        [columns],
    )

    return (
        <section className={styles.panel}>
            <div className={styles.panelHeader}>
                <h4 className={classNames('details', styles.panelTitle)}>Indexed Challenges</h4>
                <span className={styles.totalCount}>
                    {`${total} challenge${total === 1 ? '' : 's'} indexed`}
                </span>
            </div>

            <div className={styles.filters}>
                <div className={styles.searchWrapper}>
                    <InputWrapper dirty={false} disabled={false} label='' type='text'>
                        <div className={styles.searchInner}>
                            <IconOutline.SearchIcon className='icon-md' />
                            <input
                                className={classNames(styles.searchInput, 'body-small')}
                                type='text'
                                value={searchInput}
                                onChange={handleSearchChange}
                                placeholder='Search by challenge name or id…'
                                aria-label='Search challenges'
                            />
                        </div>
                    </InputWrapper>
                </div>
                <InputWrapper dirty={false} disabled={false} label='' type='text'>
                    <input
                        className={classNames(styles.plainInput, 'body-small')}
                        type='text'
                        value={filters.projectId}
                        onChange={handleFilterChange('projectId')}
                        placeholder='Project ID'
                    />
                </InputWrapper>
                <InputSelect
                    name='filterTrack'
                    label=''
                    options={TRACK_OPTIONS}
                    value={filters.track}
                    onChange={handleFilterChange('track')}
                    tabIndex={0}
                />
                <InputSelect
                    name='filterType'
                    label=''
                    options={TYPE_OPTIONS}
                    value={filters.type}
                    onChange={handleFilterChange('type')}
                    tabIndex={0}
                />
                {hasFilters && (
                    <Button
                        link
                        size='md'
                        label='Clear filters'
                        onClick={handleClearFilters}
                        className={styles.clearFilters}
                    />
                )}
            </div>

            {isLoading && <TableLoading />}

            {!isLoading && loadError && (
                <p className={styles.error}>{loadError}</p>
            )}

            {!isLoading && !loadError && challenges.length === 0 && <TableNoRecord />}

            {!isLoading && !loadError && challenges.length > 0 && (
                <>
                    <TableWrapper className={styles.tableWrapper}>
                        {isMobile ? (
                            <TableMobile
                                columns={columnsMobile}
                                data={challenges}
                                className={styles.mobileTable}
                            />
                        ) : (
                            <Table
                                columns={columns}
                                data={challenges}
                                // Ordering is server-side (newest ingestion
                                // first); sorting one page client-side would
                                // imply the whole index was sorted.
                                disableSorting
                                removeDefaultSort
                                className={styles.table}
                            />
                        )}
                    </TableWrapper>
                    <div className={styles.pagination}>
                        <span className={styles.paginationSummary}>
                            {`Showing ${(page - 1) * PER_PAGE + 1}–`
                                + `${Math.min(page * PER_PAGE, total)} of ${total}`}
                        </span>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            disabled={isLoading}
                        />
                    </div>
                </>
            )}

            <ConfirmModal
                title='Remove From Index'
                action='Remove'
                open={!!confirmDelete}
                onClose={handleCloseConfirm}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            >
                <p>
                    Remove
                    {' '}
                    <strong>{confirmDelete?.name || confirmDelete?.challengeId}</strong>
                    {' '}
                    and its
                    {' '}
                    <strong>{confirmDelete?.chunks}</strong>
                    {' '}
                    indexed chunks from the vector index? TopScout will stop returning this
                    challenge until it is ingested again.
                </p>
            </ConfirmModal>
        </section>
    )
}

export default IndexedChallengesPanel
