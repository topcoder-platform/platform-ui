/* eslint-disable complexity */
/* eslint-disable react/jsx-no-bind */
import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { debounce } from 'lodash'
import classNames from 'classnames'

import { Pagination } from '~/apps/admin/src/lib/components/common/Pagination'
import { renderRichTextToHtml } from '~/libs/shared/lib/utils/rich-text'
import { IconOutline } from '~/libs/ui'

import {
    FlexiEngagementBucket,
    FlexiEngagementDetail,
    FlexiEngagementListItem,
    FlexiEngagementListResponse,
    FlexiEngagementSortBy,
    FlexiEngagementSummaryResponse,
    FlexiSortOrder,
    getFlexiEngagementDetail,
    getFlexiEngagementList,
    getFlexiEngagementSummary,
} from '../../../../lib'
import styles from '../../FlexiTalentPage/FlexiTalentPage.module.scss'

const ENGAGEMENTS_PER_PAGE = 10
const SEARCH_DEBOUNCE_MS = 300
const DESCRIPTION_COLLAPSED_HEIGHT_PX = 126
const DESCRIPTION_OVERFLOW_TOLERANCE_PX = 1
const CURRENT_ASSIGNMENT_STATUSES = new Set(['assigned', 'selected'])

type DetailState = 'loading' | 'empty' | 'error' | 'ready'

const EMPTY_LIST_RESPONSE: FlexiEngagementListResponse = {
    data: [],
    page: 1,
    perPage: ENGAGEMENTS_PER_PAGE,
    total: 0,
    totalPages: 1,
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
})

/**
 * Formats API dates for compact rail and row display.
 *
 * @param value ISO date string returned by engagements-api-v6.
 * @returns A localized date label, or a fallback when no valid date is present.
 */
function formatDate(value?: string | null): string {
    if (!value) {
        return 'Not set'
    }

    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) {
        return 'Not set'
    }

    return dateFormatter.format(parsedDate)
}

/**
 * Converts backend enum-style status strings into display labels.
 *
 * @param status Raw engagement status.
 * @returns Title-cased status text.
 */
function formatStatusLabel(status?: string): string {
    return String(status || 'Unknown')
        .toLowerCase()
        .split('_')
        .filter(Boolean)
        .map(word => `${word.charAt(0)
            .toUpperCase()}${word.slice(1)}`)
        .join(' ')
}

/**
 * Detects whether an assignment row is still active in the engagement.
 *
 * @param status Raw assignment status returned by engagements-api-v6.
 * @returns True when the row represents current assignment work that should show time-left metadata.
 */
function isCurrentAssignmentStatus(status?: string): boolean {
    return CURRENT_ASSIGNMENT_STATUSES.has(String(status || '')
        .toLowerCase())
}

/**
 * Formats backend timing fields for current assignments without hiding overdue or negative values.
 *
 * @param assignment Assignment row returned by the detail endpoint.
 * @returns Human-readable timing text for the assignment row.
 */
function formatTimeLeft(assignment: FlexiEngagementDetail['assignments'][number]): string {
    const days = assignment.timeLeftDays
    if (days === null || days === undefined) {
        return assignment.resolvedEndDate
            ? `Ends ${formatDate(assignment.resolvedEndDate)}`
            : 'No end date'
    }

    if (days < 0 || assignment.isOverdue) {
        const overdueDays = Math.abs(days)
        return `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`
    }

    if (days === 0) {
        return 'Due today'
    }

    return `${days} ${days === 1 ? 'day' : 'days'} left`
}

/**
 * Formats the member count shown in engagement list and detail rows.
 *
 * @param assignedMemberCount Current assigned-member count from the backend.
 * @param requiredMemberCount Optional required capacity from the backend.
 * @returns Capacity label for UI display.
 */
function formatMemberCount(
    assignedMemberCount: number,
    requiredMemberCount?: number | null,
): string {
    if (requiredMemberCount === null || requiredMemberCount === undefined) {
        return `${assignedMemberCount} assigned`
    }

    return `${assignedMemberCount} of ${requiredMemberCount} assigned`
}

/**
 * Converts engagement description source into sanitized HTML for detail rail rendering.
 *
 * @param description Mixed markdown and HTML description text returned by engagements-api-v6.
 * @returns Sanitized HTML, or an empty string when the source has no renderable safe content.
 */
function renderEngagementDescriptionHtml(description?: string | null): string {
    return renderRichTextToHtml(description || '')
}

/**
 * Checks whether engagement detail includes any Work Manager links.
 *
 * @param workLinks Normalized Work Manager links from the engagement detail service.
 * @returns Whether any Work Manager URL is available.
 */
function hasWorkLinks(workLinks: FlexiEngagementDetail['workLinks']): boolean {
    return Boolean(workLinks.projectUrl || workLinks.engagementUrl || workLinks.assigneeDetailsUrl)
}

/**
 * Checks whether the rendered description is taller than the six-line collapsed region.
 *
 * @param element Rendered rich-text description container.
 * @returns True when the container needs a See More / See Less toggle.
 */
function isDescriptionOverflowingCollapsedHeight(element: HTMLDivElement): boolean {
    return element.scrollHeight > DESCRIPTION_COLLAPSED_HEIGHT_PX + DESCRIPTION_OVERFLOW_TOLERANCE_PX
}

function getErrorMessage(fallback: string): string {
    return fallback
}

const DetailSkeleton: FC = () => (
    <div className={styles.detailSkeleton}>
        <div className={classNames(styles.skeletonBlock, styles.skeletonTitle)} />
        <div className={classNames(styles.skeletonBlock, styles.skeletonLine)} />
        <div className={classNames(styles.skeletonBlock, styles.skeletonLineShort)} />
        <div className={classNames(styles.skeletonBlock, styles.skeletonCard)} />
        <div className={classNames(styles.skeletonBlock, styles.skeletonCardSmall)} />
    </div>
)

/**
 * Engagements inner view for Flexi-Talent.
 *
 * Owns summary, bucket, search, sort, pagination, row selection, and right-rail
 * detail state locally so leaving `/flexi-talent` naturally resets the view.
 */
export const EngagementsView: FC = () => {
    const summaryGenerationRef = useRef<number>(0)
    const listGenerationRef = useRef<number>(0)
    const detailGenerationRef = useRef<number>(0)
    const descriptionContentRef = useRef<HTMLDivElement>(null)

    const [summaryData, setSummaryData] = useState<FlexiEngagementSummaryResponse>()
    const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true)
    const [summaryErrorMessage, setSummaryErrorMessage] = useState<string>('')

    const [selectedBucket, setSelectedBucket] = useState<FlexiEngagementBucket>('active')
    const [rawSearchText, setRawSearchText] = useState<string>('')
    const [appliedSearchText, setAppliedSearchText] = useState<string>('')
    const [searchRefreshNonce, setSearchRefreshNonce] = useState<number>(0)
    const [sortBy, setSortBy] = useState<FlexiEngagementSortBy>('name')
    const [sortOrder, setSortOrder] = useState<FlexiSortOrder>('asc')
    const [page, setPage] = useState<number>(1)

    const [listData, setListData] = useState<FlexiEngagementListResponse>(EMPTY_LIST_RESPONSE)
    const [isListLoading, setIsListLoading] = useState<boolean>(true)
    const [listErrorMessage, setListErrorMessage] = useState<string>('')

    const [selectedEngagementId, setSelectedEngagementId] = useState<string>('')
    const [selectedEngagementRow, setSelectedEngagementRow] = useState<FlexiEngagementListItem>()
    const [detailData, setDetailData] = useState<FlexiEngagementDetail>()
    const [detailState, setDetailState] = useState<DetailState>('loading')
    const [detailErrorMessage, setDetailErrorMessage] = useState<string>('')
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false)
    const [isDescriptionCollapsible, setIsDescriptionCollapsible] = useState<boolean>(false)

    const debouncedApplySearch = useMemo(
        () => debounce((nextSearchText: string): void => {
            setAppliedSearchText(nextSearchText)
            setPage(1)
            setSearchRefreshNonce(nonce => nonce + 1)
        }, SEARCH_DEBOUNCE_MS),
        [],
    )

    const summaryBuckets = useMemo(() => [
        {
            count: summaryData?.total,
            countClassName: styles.bucketCountTotal,
            id: 'total' as FlexiEngagementBucket,
            label: 'Total Engagements',
        },
        {
            count: summaryData?.active,
            countClassName: styles.bucketCountPositive,
            id: 'active' as FlexiEngagementBucket,
            label: 'Active',
        },
        {
            count: summaryData?.closed,
            countClassName: styles.bucketCountMuted,
            id: 'closed' as FlexiEngagementBucket,
            label: 'Closed',
        },
    ], [summaryData])

    const sanitizedDescriptionHtml = useMemo(
        () => renderEngagementDescriptionHtml(detailData?.description),
        [detailData?.description],
    )

    const resetDescriptionState = useCallback((): void => {
        setIsDescriptionExpanded(false)
        setIsDescriptionCollapsible(false)
    }, [])

    /**
     * Loads bucket counts for the left rail whenever the engagement list refreshes.
     * The endpoint remains independent of list filters, but refreshing both data
     * sources together keeps their displayed totals current and consistent.
     *
     * @returns A promise that resolves after summary state is updated.
     */
    const fetchEngagementSummary = useCallback(async (): Promise<void> => {
        const generation = summaryGenerationRef.current + 1
        summaryGenerationRef.current = generation
        setIsSummaryLoading(true)
        setSummaryErrorMessage('')

        try {
            const response = await getFlexiEngagementSummary()
            if (summaryGenerationRef.current !== generation) {
                return
            }

            setSummaryData(response)
        } catch {
            if (summaryGenerationRef.current !== generation) {
                return
            }

            setSummaryErrorMessage(getErrorMessage('Could not load engagement summary.'))
        } finally {
            if (summaryGenerationRef.current === generation) {
                setIsSummaryLoading(false)
            }
        }
    }, [])

    const prepareRightRailRefresh = useCallback((): void => {
        detailGenerationRef.current += 1
        setSelectedEngagementId('')
        setSelectedEngagementRow(undefined)
        setDetailData(undefined)
        setDetailErrorMessage('')
        setDetailState('loading')
        resetDescriptionState()
    }, [resetDescriptionState])

    /**
     * Loads detail for a selected engagement row.
     *
     * @param row Engagement list row selected by auto-selection or user click.
     * @returns A promise that resolves after detail state is updated.
     */
    const fetchSelectedEngagementDetail = useCallback(async (
        row: FlexiEngagementListItem,
    ): Promise<void> => {
        const generation = detailGenerationRef.current + 1
        detailGenerationRef.current = generation
        setDetailData(undefined)
        setDetailErrorMessage('')
        setDetailState('loading')
        resetDescriptionState()

        try {
            const response = await getFlexiEngagementDetail(row.engagementId)
            if (detailGenerationRef.current !== generation) {
                return
            }

            resetDescriptionState()
            setDetailData(response)
            setDetailState('ready')
        } catch {
            if (detailGenerationRef.current !== generation) {
                return
            }

            setDetailErrorMessage(getErrorMessage('Could not load engagement details.'))
            setDetailState('error')
        }
    }, [resetDescriptionState])

    /**
     * Refreshes the current engagement list and auto-selects the first returned row.
     *
     * @returns A promise that resolves after list state and any first-row detail fetch are started.
     */
    const refreshEngagementList = useCallback(async (): Promise<void> => {
        const generation = listGenerationRef.current + 1
        listGenerationRef.current = generation
        prepareRightRailRefresh()
        setIsListLoading(true)
        setListErrorMessage('')

        try {
            const response = await getFlexiEngagementList({
                bucket: selectedBucket,
                page,
                perPage: ENGAGEMENTS_PER_PAGE,
                searchText: appliedSearchText,
                sortBy,
                sortOrder,
            })
            if (listGenerationRef.current !== generation) {
                return
            }

            const nextListData: FlexiEngagementListResponse = {
                data: Array.isArray(response.data) ? response.data : [],
                page: response.page || page,
                perPage: response.perPage || ENGAGEMENTS_PER_PAGE,
                total: response.total || 0,
                totalPages: Math.max(response.totalPages || 1, 1),
            }

            setListData(nextListData)

            const firstRow = nextListData.data[0]
            if (!firstRow) {
                setSelectedEngagementId('')
                setSelectedEngagementRow(undefined)
                setDetailData(undefined)
                setDetailState('empty')
                return
            }

            setSelectedEngagementId(firstRow.engagementId)
            setSelectedEngagementRow(firstRow)
            setDetailState('loading')
            fetchSelectedEngagementDetail(firstRow)
                .catch(() => undefined)
        } catch {
            if (listGenerationRef.current !== generation) {
                return
            }

            setListData({
                ...EMPTY_LIST_RESPONSE,
                page,
            })
            setListErrorMessage(getErrorMessage('Could not load engagements.'))
            setSelectedEngagementId('')
            setSelectedEngagementRow(undefined)
            setDetailData(undefined)
            setDetailState('empty')
        } finally {
            if (listGenerationRef.current === generation) {
                setIsListLoading(false)
            }
        }
    }, [
        appliedSearchText,
        fetchSelectedEngagementDetail,
        page,
        prepareRightRailRefresh,
        searchRefreshNonce,
        selectedBucket,
        sortBy,
        sortOrder,
    ])

    useEffect(() => {
        fetchEngagementSummary()
            .catch(() => undefined)
        refreshEngagementList()
            .catch(() => undefined)
    }, [fetchEngagementSummary, refreshEngagementList])

    useEffect(() => () => {
        debouncedApplySearch.cancel()
        summaryGenerationRef.current += 1
        listGenerationRef.current += 1
        detailGenerationRef.current += 1
    }, [debouncedApplySearch])

    useEffect(() => {
        if (detailState !== 'ready' || !sanitizedDescriptionHtml) {
            setIsDescriptionCollapsible(false)
            return undefined
        }

        const measureDescription = (): void => {
            const descriptionElement = descriptionContentRef.current
            setIsDescriptionCollapsible(
                descriptionElement
                    ? isDescriptionOverflowingCollapsedHeight(descriptionElement)
                    : false,
            )
        }

        if (typeof window === 'undefined') {
            measureDescription()
            return undefined
        }

        const animationFrame = window.requestAnimationFrame(measureDescription)
        window.addEventListener('resize', measureDescription)

        return () => {
            window.cancelAnimationFrame(animationFrame)
            window.removeEventListener('resize', measureDescription)
        }
    }, [detailState, sanitizedDescriptionHtml])

    const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        const nextSearchText = event.target.value || ''
        prepareRightRailRefresh()
        setRawSearchText(nextSearchText)
        debouncedApplySearch(nextSearchText)
    }, [debouncedApplySearch, prepareRightRailRefresh])

    const handleSearchClear = useCallback((): void => {
        prepareRightRailRefresh()
        setRawSearchText('')
        debouncedApplySearch('')
    }, [debouncedApplySearch, prepareRightRailRefresh])

    const handleBucketClick = useCallback((bucket: FlexiEngagementBucket): void => {
        if (bucket === selectedBucket) {
            return
        }

        prepareRightRailRefresh()
        setSelectedBucket(bucket)
        setPage(1)
    }, [prepareRightRailRefresh, selectedBucket])

    const handleSortClick = useCallback((field: FlexiEngagementSortBy): void => {
        prepareRightRailRefresh()

        if (field === sortBy) {
            setSortOrder(currentSortOrder => (currentSortOrder === 'asc' ? 'desc' : 'asc'))
            return
        }

        setSortBy(field)
        setSortOrder('asc')
    }, [prepareRightRailRefresh, sortBy])

    const handlePageChange = useCallback((nextPage: number): void => {
        if (nextPage === page) {
            return
        }

        prepareRightRailRefresh()
        setPage(nextPage)
    }, [page, prepareRightRailRefresh])

    const handleRowClick = useCallback((row: FlexiEngagementListItem): void => {
        setSelectedEngagementId(row.engagementId)
        setSelectedEngagementRow(row)
        fetchSelectedEngagementDetail(row)
            .catch(() => undefined)
    }, [fetchSelectedEngagementDetail])

    const handleDescriptionToggle = useCallback((): void => {
        setIsDescriptionExpanded(currentValue => !currentValue)
    }, [])

    const renderSummaryCount = useCallback((count: number | undefined): string => {
        if (isSummaryLoading) {
            return '--'
        }

        return String(count ?? 0)
    }, [isSummaryLoading])

    const shouldShowPagination = !isListLoading && !listErrorMessage && listData.totalPages > 1
    const selectedDetailTitle = selectedEngagementRow
        ? selectedEngagementRow.engagementTitle
        : 'Selected engagement'
    const listTotalLabel = isListLoading ? '--' : String(listData.total)
    const listPageLabel = isListLoading ? '--' : String(listData.page)
    const listTotalPagesLabel = isListLoading ? '--' : String(listData.totalPages)

    return (
        <div className={styles.engagementGrid}>
            <aside className={classNames(styles.pane, styles.summaryPane)}>
                <div className={styles.paneHeader}>
                    <p className={styles.paneEyebrow}>Summary</p>
                    <h2 className={styles.paneTitle}>Engagement buckets</h2>
                </div>

                {summaryErrorMessage && (
                    <div className={styles.inlineError}>{summaryErrorMessage}</div>
                )}

                <div className={styles.bucketList}>
                    {summaryBuckets.map(bucket => (
                        <button
                            className={classNames(
                                styles.bucketButton,
                                selectedBucket === bucket.id && styles.bucketButtonActive,
                            )}
                            key={bucket.id}
                            onClick={() => handleBucketClick(bucket.id)}
                            type='button'
                        >
                            <span>{bucket.label}</span>
                            <strong className={bucket.countClassName}>{renderSummaryCount(bucket.count)}</strong>
                        </button>
                    ))}
                </div>

                <p className={styles.summaryNote}>
                    Total includes only Active and Closed engagements. Active is the default bucket.
                </p>
            </aside>

            <section className={classNames(styles.pane, styles.listPane)}>
                <div className={styles.listToolbar}>
                    <label className={styles.searchField}>
                        <IconOutline.SearchIcon className={styles.searchIcon} />
                        <input
                            onChange={handleSearchChange}
                            placeholder='Search engagement or project'
                            type='text'
                            value={rawSearchText}
                        />
                        {rawSearchText && (
                            <button
                                aria-label='Clear search'
                                className={styles.searchClearButton}
                                onClick={handleSearchClear}
                                type='button'
                            >
                                <IconOutline.XIcon />
                            </button>
                        )}
                    </label>
                </div>

                <div className={styles.sortBar} aria-label='Sort engagements'>
                    <button
                        className={classNames(styles.sortButton, sortBy === 'name' && styles.sortButtonActive)}
                        onClick={() => handleSortClick('name')}
                        type='button'
                    >
                        Name
                        {sortBy === 'name' && (
                            <>
                                <span className={styles.sortDirectionIndicator} aria-hidden='true'>
                                    {sortOrder === 'asc' ? (
                                        <IconOutline.ArrowUpIcon />
                                    ) : (
                                        <IconOutline.ArrowDownIcon />
                                    )}
                                </span>
                                <span className={styles.visuallyHidden}>
                                    {sortOrder === 'asc' ? 'sorted ascending' : 'sorted descending'}
                                </span>
                            </>
                        )}
                    </button>
                    <button
                        className={classNames(styles.sortButton, sortBy === 'memberCount' && styles.sortButtonActive)}
                        onClick={() => handleSortClick('memberCount')}
                        type='button'
                    >
                        Members
                        {sortBy === 'memberCount' && (
                            <>
                                <span className={styles.sortDirectionIndicator} aria-hidden='true'>
                                    {sortOrder === 'asc' ? (
                                        <IconOutline.ArrowUpIcon />
                                    ) : (
                                        <IconOutline.ArrowDownIcon />
                                    )}
                                </span>
                                <span className={styles.visuallyHidden}>
                                    {sortOrder === 'asc' ? 'sorted ascending' : 'sorted descending'}
                                </span>
                            </>
                        )}
                    </button>
                </div>

                <div className={styles.listMeta}>
                    <span>
                        {listTotalLabel}
                        {' engagements'}
                    </span>
                    <span>
                        {'Page '}
                        {listPageLabel}
                        {' of '}
                        {listTotalPagesLabel}
                    </span>
                </div>

                {listErrorMessage && (
                    <div className={styles.inlineError}>{listErrorMessage}</div>
                )}

                {isListLoading && (
                    <div className={styles.listSkeleton} aria-label='Loading engagements'>
                        <div className={classNames(styles.skeletonBlock, styles.rowSkeleton)} />
                        <div className={classNames(styles.skeletonBlock, styles.rowSkeleton)} />
                        <div className={classNames(styles.skeletonBlock, styles.rowSkeleton)} />
                    </div>
                )}

                {!isListLoading && !listErrorMessage && listData.data.length === 0 && (
                    <div className={styles.emptyState}>
                        <IconOutline.InboxIcon />
                        <p>No engagements match the current filters.</p>
                    </div>
                )}

                {!isListLoading && !listErrorMessage && listData.data.length > 0 && (
                    <div className={styles.engagementRows}>
                        {listData.data.map(row => (
                            <button
                                className={classNames(
                                    styles.engagementRow,
                                    selectedEngagementId === row.engagementId && styles.engagementRowActive,
                                )}
                                key={row.engagementId}
                                onClick={() => handleRowClick(row)}
                                type='button'
                            >
                                <span className={styles.rowMain}>
                                    <strong>{row.engagementTitle}</strong>
                                    <span>{row.projectName || 'Project name unavailable'}</span>
                                </span>
                                <span className={styles.rowMeta}>
                                    <span className={styles.statusPill}>{formatStatusLabel(row.status)}</span>
                                    <span className={styles.memberPill}>
                                        {formatMemberCount(row.assignedMemberCount, row.requiredMemberCount)}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {shouldShowPagination && (
                    <div className={styles.paginationWrap}>
                        <Pagination
                            disabled={isListLoading}
                            onPageChange={handlePageChange}
                            page={listData.page}
                            totalPages={listData.totalPages}
                        />
                    </div>
                )}
            </section>

            <aside className={classNames(styles.pane, styles.detailPane)}>
                {detailState === 'loading' && <DetailSkeleton />}

                {detailState === 'empty' && (
                    <div className={styles.detailEmpty}>
                        <IconOutline.DocumentSearchIcon />
                        <p>Select an engagement to view assignment details.</p>
                    </div>
                )}

                {detailState === 'error' && (
                    <div className={styles.detailError}>
                        <IconOutline.ExclamationCircleIcon />
                        <div>
                            <h3>{selectedDetailTitle}</h3>
                            <p>{detailErrorMessage}</p>
                        </div>
                    </div>
                )}

                {detailState === 'ready' && detailData && (
                    <div className={styles.detailContent}>
                        <div className={styles.detailHeader}>
                            <span className={styles.statusPill}>{formatStatusLabel(detailData.status)}</span>
                            <h3>{detailData.engagementTitle}</h3>
                            {hasWorkLinks(detailData.workLinks) && (
                                <div className={classNames(styles.workLinks, styles.detailHeaderWorkLinks)}>
                                    {detailData.workLinks.projectUrl && (
                                        <a href={detailData.workLinks.projectUrl} rel='noreferrer' target='_blank'>
                                            Project
                                            <IconOutline.ExternalLinkIcon />
                                        </a>
                                    )}
                                    {detailData.workLinks.engagementUrl && (
                                        <a href={detailData.workLinks.engagementUrl} rel='noreferrer' target='_blank'>
                                            Engagement
                                            <IconOutline.ExternalLinkIcon />
                                        </a>
                                    )}
                                    {detailData.workLinks.assigneeDetailsUrl && (
                                        <a
                                            href={detailData.workLinks.assigneeDetailsUrl}
                                            rel='noreferrer'
                                            target='_blank'
                                        >
                                            Assignee Details
                                            <IconOutline.ExternalLinkIcon />
                                        </a>
                                    )}
                                </div>
                            )}
                            <p>{detailData.projectName || 'Project name unavailable'}</p>
                            <span className={styles.detailCapacity}>
                                {formatMemberCount(detailData.assignedMemberCount, detailData.requiredMemberCount)}
                            </span>
                        </div>

                        <div className={styles.detailSection}>
                            <h4>Description</h4>
                            {sanitizedDescriptionHtml ? (
                                <div className={styles.descriptionFrame}>
                                    <div
                                        className={classNames(
                                            styles.descriptionRichText,
                                            !isDescriptionExpanded && styles.descriptionRichTextCollapsed,
                                        )}
                                        dangerouslySetInnerHTML={{ __html: sanitizedDescriptionHtml }}
                                        ref={descriptionContentRef}
                                    />
                                    {isDescriptionCollapsible && (
                                        <button
                                            aria-expanded={isDescriptionExpanded}
                                            className={classNames(
                                                styles.descriptionToggleButton,
                                                !isDescriptionExpanded && styles.descriptionToggleButtonCollapsed,
                                            )}
                                            onClick={handleDescriptionToggle}
                                            type='button'
                                        >
                                            {isDescriptionExpanded ? 'See Less' : 'See More'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <p>No description provided.</p>
                            )}
                        </div>

                        <div className={styles.detailSection}>
                            <h4>Skills</h4>
                            {detailData.skills.length > 0 ? (
                                <div className={styles.skillList}>
                                    {detailData.skills.map(skill => (
                                        <span className={styles.skillPill} key={skill.id}>{skill.name}</span>
                                    ))}
                                </div>
                            ) : (
                                <p>No skills listed.</p>
                            )}
                        </div>

                        <div className={styles.detailSection}>
                            <h4>Assignments</h4>
                            {detailData.assignments.length > 0 ? (
                                <div className={styles.assignmentRows}>
                                    {detailData.assignments.map(assignment => (
                                        <div className={styles.assignmentRow} key={assignment.assignmentId}>
                                            <div className={styles.assignmentHeader}>
                                                <strong>{assignment.memberHandle}</strong>
                                                <span className={styles.statusPill}>
                                                    {assignment.displayStatusLabel}
                                                </span>
                                            </div>
                                            <dl className={styles.assignmentMeta}>
                                                {isCurrentAssignmentStatus(assignment.status) && (
                                                    <div>
                                                        <dt>Time Left</dt>
                                                        <dd
                                                            className={
                                                                assignment.isOverdue ? styles.overdueText : undefined
                                                            }
                                                        >
                                                            {formatTimeLeft(assignment)}
                                                        </dd>
                                                    </div>
                                                )}
                                                <div>
                                                    <dt>Duration</dt>
                                                    <dd>{assignment.durationLabel || 'Not set'}</dd>
                                                </div>
                                                <div>
                                                    <dt>Start</dt>
                                                    <dd>{formatDate(assignment.startDate)}</dd>
                                                </div>
                                                <div>
                                                    <dt>Resolved End</dt>
                                                    <dd>{formatDate(assignment.resolvedEndDate)}</dd>
                                                </div>
                                            </dl>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No assignment rows returned.</p>
                            )}
                        </div>
                    </div>
                )}
            </aside>
        </div>
    )
}

export default EngagementsView
