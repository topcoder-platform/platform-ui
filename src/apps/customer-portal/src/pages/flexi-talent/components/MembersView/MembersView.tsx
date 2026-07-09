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
    FlexiMemberBucket,
    FlexiMemberDetail,
    FlexiMemberListItem,
    FlexiMemberListResponse,
    FlexiMemberSortBy,
    FlexiMemberSummaryResponse,
    FlexiMemberWorkLinks,
    FlexiSortOrder,
    getFlexiMemberDetail,
    getFlexiMemberList,
    getFlexiMemberSummary,
} from '../../../../lib'
import { MemberHistoryModal } from '../MemberHistoryModal'
import styles from '../../FlexiTalentPage/FlexiTalentPage.module.scss'

const MEMBERS_PER_PAGE = 10
const SEARCH_DEBOUNCE_MS = 300

type DetailState = 'loading' | 'empty' | 'error' | 'ready'

interface MembersViewProps {
    isActive: boolean
}

interface FlexiMemberTimingFields {
    daysRemaining?: number | null
    isOverdue?: boolean | null
    resolvedEndDate?: string | null
    timeLeftDays?: number | null
}

const EMPTY_LIST_RESPONSE: FlexiMemberListResponse = {
    data: [],
    page: 1,
    perPage: MEMBERS_PER_PAGE,
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
 * Builds a one-line assignment context for member list rows.
 *
 * @param row Member list row returned by the list endpoint.
 * @returns Project and engagement context, or fallback text when neither is present.
 */
function formatListContext(row: FlexiMemberListItem): string {
    const contextParts = [
        row.primaryProjectName || '',
        row.primaryEngagementTitle || '',
    ].filter(Boolean)

    return contextParts.length > 0 ? contextParts.join(' - ') : 'Assignment context unavailable'
}

/**
 * Builds a one-line assignment context for member detail rows.
 *
 * @param detail Member detail returned by the detail endpoint.
 * @returns Project and engagement context, or fallback text when neither is present.
 */
function formatDetailContext(detail: FlexiMemberDetail): string {
    const contextParts = [
        detail.projectName || '',
        detail.engagementTitle || '',
    ].filter(Boolean)

    return contextParts.length > 0 ? contextParts.join(' - ') : 'Assignment context unavailable'
}

/**
 * Returns the current-assignment time-left value from backend fields.
 *
 * @param value Member list or detail row with backend timing fields.
 * @returns The days-remaining number, or undefined when no timing field is present.
 */
function getRemainingDays(value: FlexiMemberTimingFields): number | undefined {
    const days = value.daysRemaining ?? value.timeLeftDays

    return days === null || days === undefined ? undefined : days
}

/**
 * Formats current-assignment timing from backend timing fields.
 *
 * @param value Member detail or list row timing fields.
 * @returns Human-readable current-assignment timing text.
 */
function formatCurrentTiming(value: FlexiMemberTimingFields): string {
    const days = getRemainingDays(value)
    if (days === undefined) {
        return value.resolvedEndDate
            ? `Ends ${formatDate(value.resolvedEndDate)}`
            : 'No end date'
    }

    if (days < 0 || value.isOverdue) {
        const overdueDays = Math.abs(days)
        return `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`
    }

    if (days === 0) {
        return 'Due today'
    }

    return `${days} ${days === 1 ? 'day' : 'days'} left`
}

/**
 * Formats list-row timing from member API fields.
 *
 * @param row Member list row returned by the list endpoint.
 * @returns Current time-left or completed-date metadata for the row.
 */
function formatListTiming(row: FlexiMemberListItem): string {
    if (row.isCurrentlyAssigned) {
        const days = row.daysRemaining
        if (days === null || days === undefined) {
            return 'No end date'
        }

        if (days < 0) {
            const overdueDays = Math.abs(days)
            return `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`
        }

        if (days === 0) {
            return 'Due today'
        }

        return `${days} ${days === 1 ? 'day' : 'days'} left`
    }

    return row.latestCompletedAt
        ? `Completed ${formatDate(row.latestCompletedAt)}`
        : 'Completion date not set'
}

/**
 * Detects whether a member list row represents an overdue current assignment.
 *
 * @param row Member list row returned by the list endpoint.
 * @returns True when the current assignment has a negative days-remaining value.
 */
function isListRowOverdue(row: FlexiMemberListItem): boolean {
    const days = row.daysRemaining

    return Boolean(row.isCurrentlyAssigned && days !== undefined && days !== null && days < 0)
}

/**
 * Detects whether the selected member detail represents an overdue current assignment.
 *
 * @param detail Member detail returned by the detail endpoint.
 * @returns True when the current assignment has negative remaining days or an overdue flag.
 */
function isDetailOverdue(detail: FlexiMemberDetail): boolean {
    const days = getRemainingDays(detail)

    return Boolean(detail.isCurrentlyAssigned && ((days !== undefined && days < 0) || detail.isOverdue))
}

/**
 * Formats detail timing, preserving current versus completed framing.
 *
 * Current timing comes from the detail endpoint. Completed timing comes from the
 * selected list row because the detail DTO does not expose completion fields.
 *
 * @param detail Member detail returned by the detail endpoint.
 * @param selectedRow Selected list row that owns the detail payload.
 * @returns Human-readable timing text for the right rail.
 */
function formatDetailTiming(
    detail: FlexiMemberDetail,
    selectedRow?: FlexiMemberListItem,
): string {
    if (detail.isCurrentlyAssigned) {
        return formatCurrentTiming(detail)
    }

    const completedAt = selectedRow?.memberId === detail.memberId
        ? selectedRow.latestCompletedAt
        : undefined
    if (completedAt) {
        return `Completed ${formatDate(completedAt)}`
    }

    return 'Completion date not set'
}

/**
 * Formats backend duration fields for right-rail detail display.
 *
 * @param detail Member detail returned by the detail endpoint.
 * @returns Duration label, computed month/week label, or fallback text.
 */
function formatDuration(detail: FlexiMemberDetail): string {
    if (detail.durationLabel) {
        return detail.durationLabel
    }

    const durationParts = [
        detail.durationMonths ? `${detail.durationMonths} mo` : '',
        detail.durationWeeks ? `${detail.durationWeeks} wk` : '',
    ].filter(Boolean)

    if (durationParts.length > 0) {
        return durationParts.join(' ')
    }

    return 'Not set'
}

/**
 * Detects whether a normalized Work-link collection contains any destinations.
 *
 * @param workLinks Normalized Work Manager links from the member service.
 * @returns True when at least one Work destination can be rendered.
 */
function hasWorkLinks(workLinks: FlexiMemberWorkLinks): boolean {
    return Boolean(workLinks.projectUrl || workLinks.engagementUrl || workLinks.assigneeDetailsUrl)
}

/**
 * Returns the standard member view error fallback.
 *
 * @param fallback Static fallback message for the failed request.
 * @returns Error message shown in the matching pane.
 */
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
 * Members inner view for Flexi-Talent.
 *
 * Owns summary, bucket, handle search, sort, pagination, row selection, right-rail
 * detail state, and history modal state locally. Initial requests are deferred
 * until the Members tab is activated for the first time.
 */
export const MembersView: FC<MembersViewProps> = props => {
    const summaryGenerationRef = useRef<number>(0)
    const listGenerationRef = useRef<number>(0)
    const detailGenerationRef = useRef<number>(0)

    const [hasActivated, setHasActivated] = useState<boolean>(false)

    const [summaryData, setSummaryData] = useState<FlexiMemberSummaryResponse>()
    const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false)
    const [summaryErrorMessage, setSummaryErrorMessage] = useState<string>('')

    const [selectedBucket, setSelectedBucket] = useState<FlexiMemberBucket>('total')
    const [rawSearchText, setRawSearchText] = useState<string>('')
    const [appliedSearchText, setAppliedSearchText] = useState<string>('')
    const [searchRefreshNonce, setSearchRefreshNonce] = useState<number>(0)
    const [sortBy, setSortBy] = useState<FlexiMemberSortBy>('handle')
    const [sortOrder, setSortOrder] = useState<FlexiSortOrder>('asc')
    const [page, setPage] = useState<number>(1)

    const [listData, setListData] = useState<FlexiMemberListResponse>(EMPTY_LIST_RESPONSE)
    const [isListLoading, setIsListLoading] = useState<boolean>(false)
    const [listErrorMessage, setListErrorMessage] = useState<string>('')

    const [selectedMemberId, setSelectedMemberId] = useState<string>('')
    const [selectedMemberRow, setSelectedMemberRow] = useState<FlexiMemberListItem>()
    const [detailData, setDetailData] = useState<FlexiMemberDetail>()
    const [detailState, setDetailState] = useState<DetailState>('empty')
    const [detailErrorMessage, setDetailErrorMessage] = useState<string>('')
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false)

    const isFirstActivationLoading = props.isActive && !hasActivated
    const isEffectiveSummaryLoading = isSummaryLoading || isFirstActivationLoading
    const isEffectiveListLoading = isListLoading || isFirstActivationLoading
    const effectiveDetailState: DetailState = isFirstActivationLoading
        ? 'loading'
        : detailState

    useEffect(() => {
        if (!props.isActive || hasActivated) {
            return
        }

        setHasActivated(true)
        setIsSummaryLoading(true)
        setSummaryErrorMessage('')
        setIsListLoading(true)
        setListErrorMessage('')
        setDetailData(undefined)
        setDetailErrorMessage('')
        setDetailState('loading')
    }, [hasActivated, props.isActive])

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
            count: summaryData?.totalUniqueMembers,
            countClassName: styles.bucketCountTotal,
            id: 'total' as FlexiMemberBucket,
            label: 'Total Unique Members',
        },
        {
            count: summaryData?.assignedMembers,
            countClassName: styles.bucketCountPositive,
            id: 'assigned' as FlexiMemberBucket,
            label: 'Assigned',
        },
        {
            count: summaryData?.completedMembers,
            countClassName: styles.bucketCountMuted,
            id: 'completed' as FlexiMemberBucket,
            label: 'Completed',
        },
    ], [summaryData])

    /**
     * Loads member bucket counts once for the left rail, independent of list filters.
     *
     * @returns A promise that resolves after summary state is updated.
     */
    const fetchMemberSummary = useCallback(async (): Promise<void> => {
        const generation = summaryGenerationRef.current + 1
        summaryGenerationRef.current = generation
        setIsSummaryLoading(true)
        setSummaryErrorMessage('')

        try {
            const response = await getFlexiMemberSummary()
            if (summaryGenerationRef.current !== generation) {
                return
            }

            setSummaryData(response)
        } catch {
            if (summaryGenerationRef.current !== generation) {
                return
            }

            setSummaryErrorMessage(getErrorMessage('Could not load member summary.'))
        } finally {
            if (summaryGenerationRef.current === generation) {
                setIsSummaryLoading(false)
            }
        }
    }, [])

    const prepareRightRailRefresh = useCallback((): void => {
        detailGenerationRef.current += 1
        setSelectedMemberId('')
        setSelectedMemberRow(undefined)
        setDetailData(undefined)
        setDetailErrorMessage('')
        setDetailState('loading')
        setIsHistoryModalOpen(false)
    }, [])

    /**
     * Loads detail for a selected member row.
     *
     * @param row Member list row selected by auto-selection or user click.
     * @returns A promise that resolves after detail state is updated.
     */
    const fetchSelectedMemberDetail = useCallback(async (
        row: FlexiMemberListItem,
    ): Promise<void> => {
        const generation = detailGenerationRef.current + 1
        detailGenerationRef.current = generation
        setDetailData(undefined)
        setDetailErrorMessage('')
        setDetailState('loading')

        try {
            const response = await getFlexiMemberDetail(row.memberId)
            if (detailGenerationRef.current !== generation) {
                return
            }

            setDetailData(response)
            setDetailState('ready')
        } catch {
            if (detailGenerationRef.current !== generation) {
                return
            }

            setDetailErrorMessage(getErrorMessage('Could not load member details.'))
            setDetailState('error')
        }
    }, [])

    /**
     * Refreshes the current member list and auto-selects the first returned row.
     *
     * @returns A promise that resolves after list state and any first-row detail fetch are started.
     */
    const refreshMemberList = useCallback(async (): Promise<void> => {
        const generation = listGenerationRef.current + 1
        listGenerationRef.current = generation
        prepareRightRailRefresh()
        setIsListLoading(true)
        setListErrorMessage('')

        try {
            const response = await getFlexiMemberList({
                bucket: selectedBucket,
                page,
                perPage: MEMBERS_PER_PAGE,
                searchText: appliedSearchText,
                sortBy,
                sortOrder,
            })
            if (listGenerationRef.current !== generation) {
                return
            }

            const nextListData: FlexiMemberListResponse = {
                data: Array.isArray(response.data) ? response.data : [],
                page: response.page || page,
                perPage: response.perPage || MEMBERS_PER_PAGE,
                total: response.total || 0,
                totalPages: Math.max(response.totalPages || 1, 1),
            }

            setListData(nextListData)

            const firstRow = nextListData.data[0]
            if (!firstRow) {
                setSelectedMemberId('')
                setSelectedMemberRow(undefined)
                setDetailData(undefined)
                setDetailState('empty')
                return
            }

            setSelectedMemberId(firstRow.memberId)
            setSelectedMemberRow(firstRow)
            setDetailState('loading')
            fetchSelectedMemberDetail(firstRow)
                .catch(() => undefined)
        } catch {
            if (listGenerationRef.current !== generation) {
                return
            }

            setListData({
                ...EMPTY_LIST_RESPONSE,
                page,
            })
            setListErrorMessage(getErrorMessage('Could not load members.'))
            setSelectedMemberId('')
            setSelectedMemberRow(undefined)
            setDetailData(undefined)
            setDetailState('empty')
        } finally {
            if (listGenerationRef.current === generation) {
                setIsListLoading(false)
            }
        }
    }, [
        appliedSearchText,
        fetchSelectedMemberDetail,
        page,
        prepareRightRailRefresh,
        searchRefreshNonce,
        selectedBucket,
        sortBy,
        sortOrder,
    ])

    useEffect(() => {
        if (!hasActivated) {
            return
        }

        fetchMemberSummary()
            .catch(() => undefined)
    }, [fetchMemberSummary, hasActivated])

    useEffect(() => {
        if (!hasActivated) {
            return
        }

        refreshMemberList()
            .catch(() => undefined)
    }, [hasActivated, refreshMemberList])

    useEffect(() => () => {
        debouncedApplySearch.cancel()
        summaryGenerationRef.current += 1
        listGenerationRef.current += 1
        detailGenerationRef.current += 1
    }, [debouncedApplySearch])

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

    const handleBucketClick = useCallback((bucket: FlexiMemberBucket): void => {
        if (bucket === selectedBucket) {
            return
        }

        prepareRightRailRefresh()
        setSelectedBucket(bucket)
        setPage(1)
    }, [prepareRightRailRefresh, selectedBucket])

    const handleSortClick = useCallback((field: FlexiMemberSortBy): void => {
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

    const handleRowClick = useCallback((row: FlexiMemberListItem): void => {
        setSelectedMemberId(row.memberId)
        setSelectedMemberRow(row)
        fetchSelectedMemberDetail(row)
            .catch(() => undefined)
    }, [fetchSelectedMemberDetail])

    const handleHistoryOpen = useCallback((): void => {
        if (selectedMemberId) {
            setIsHistoryModalOpen(true)
        }
    }, [selectedMemberId])

    const handleHistoryClose = useCallback((): void => {
        setIsHistoryModalOpen(false)
    }, [])

    const renderSummaryCount = useCallback((count: number | undefined): string => {
        if (isEffectiveSummaryLoading) {
            return '--'
        }

        return String(count ?? 0)
    }, [isEffectiveSummaryLoading])

    const shouldShowPagination = !isEffectiveListLoading && !listErrorMessage && listData.totalPages > 1
    const selectedDetailTitle = selectedMemberRow
        ? selectedMemberRow.handle
        : 'Selected member'
    const sanitizedDescriptionHtml = useMemo(
        () => renderRichTextToHtml(detailData?.description || ''),
        [detailData?.description],
    )
    const listTotalLabel = isEffectiveListLoading ? '--' : String(listData.total)
    const listPageLabel = isEffectiveListLoading ? '--' : String(listData.page)
    const listTotalPagesLabel = isEffectiveListLoading ? '--' : String(listData.totalPages)

    return (
        <div className={styles.engagementGrid}>
            <aside className={classNames(styles.pane, styles.summaryPane)}>
                <div className={styles.paneHeader}>
                    <p className={styles.paneEyebrow}>Summary</p>
                    <h2 className={styles.paneTitle}>Member buckets</h2>
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
                    Counts are not affected by member search or list filters.
                </p>
            </aside>

            <section className={classNames(styles.pane, styles.listPane)}>
                <div className={styles.listToolbar}>
                    <label className={styles.searchField}>
                        <IconOutline.SearchIcon className={styles.searchIcon} />
                        <input
                            onChange={handleSearchChange}
                            placeholder='Search member handle'
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

                <div className={styles.sortBar} aria-label='Sort members'>
                    <button
                        className={classNames(styles.sortButton, sortBy === 'handle' && styles.sortButtonActive)}
                        onClick={() => handleSortClick('handle')}
                        type='button'
                    >
                        Handle
                        {sortBy === 'handle' && (
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
                        className={classNames(styles.sortButton, sortBy === 'time' && styles.sortButtonActive)}
                        onClick={() => handleSortClick('time')}
                        type='button'
                    >
                        Time
                        {sortBy === 'time' && (
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
                        {' members'}
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

                {isEffectiveListLoading && (
                    <div className={styles.listSkeleton} aria-label='Loading members'>
                        <div className={classNames(styles.skeletonBlock, styles.rowSkeleton)} />
                        <div className={classNames(styles.skeletonBlock, styles.rowSkeleton)} />
                        <div className={classNames(styles.skeletonBlock, styles.rowSkeleton)} />
                    </div>
                )}

                {!isEffectiveListLoading && !listErrorMessage && listData.data.length === 0 && (
                    <div className={styles.emptyState}>
                        <IconOutline.InboxIcon />
                        <p>No members match the current filters.</p>
                    </div>
                )}

                {!isEffectiveListLoading && !listErrorMessage && listData.data.length > 0 && (
                    <div className={styles.memberRows}>
                        {listData.data.map(row => (
                            <button
                                className={classNames(
                                    styles.engagementRow,
                                    styles.memberRow,
                                    selectedMemberId === row.memberId && styles.engagementRowActive,
                                )}
                                key={row.memberId}
                                onClick={() => handleRowClick(row)}
                                type='button'
                            >
                                <span className={styles.rowMain}>
                                    <strong>{row.handle}</strong>
                                    <span>{formatListContext(row)}</span>
                                </span>
                                <span className={styles.rowMeta}>
                                    <span
                                        className={classNames(
                                            styles.statusPill,
                                            row.isCurrentlyAssigned
                                                ? styles.statusPillCurrent
                                                : styles.statusPillCompleted,
                                        )}
                                    >
                                        {row.displayStatusLabel}
                                    </span>
                                    <span
                                        className={classNames(
                                            styles.memberTimePill,
                                            isListRowOverdue(row) && styles.memberTimePillOverdue,
                                        )}
                                    >
                                        {formatListTiming(row)}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {shouldShowPagination && (
                    <div className={styles.paginationWrap}>
                        <Pagination
                            disabled={isEffectiveListLoading}
                            onPageChange={handlePageChange}
                            page={listData.page}
                            totalPages={listData.totalPages}
                        />
                    </div>
                )}
            </section>

            <aside className={classNames(styles.pane, styles.detailPane)}>
                {effectiveDetailState === 'loading' && <DetailSkeleton />}

                {effectiveDetailState === 'empty' && (
                    <div className={styles.detailEmpty}>
                        <IconOutline.DocumentSearchIcon />
                        <p>Select a member to view assignment details.</p>
                    </div>
                )}

                {effectiveDetailState === 'error' && (
                    <div className={styles.detailError}>
                        <IconOutline.ExclamationCircleIcon />
                        <div>
                            <h3>{selectedDetailTitle}</h3>
                            <p>{detailErrorMessage}</p>
                        </div>
                    </div>
                )}

                {effectiveDetailState === 'ready' && detailData && (
                    <div className={styles.detailContent}>
                        <div className={styles.detailHeader}>
                            <div className={styles.detailHeaderActions}>
                                <span
                                    className={classNames(
                                        styles.statusPill,
                                        detailData.isCurrentlyAssigned
                                            ? styles.statusPillCurrent
                                            : styles.statusPillCompleted,
                                    )}
                                >
                                    {detailData.displayStatusLabel}
                                </span>
                                <button
                                    className={styles.historyButton}
                                    onClick={handleHistoryOpen}
                                    type='button'
                                >
                                    <IconOutline.ClockIcon />
                                    History
                                </button>
                            </div>
                            <h3>{detailData.handle}</h3>
                            <p>
                                {detailData.isCurrentlyAssigned
                                    ? 'Current assignment'
                                    : 'Latest assignment'}
                            </p>
                            <span className={styles.detailCapacity}>
                                {formatDetailContext(detailData)}
                            </span>
                        </div>

                        <div className={styles.detailSection}>
                            <h4>
                                {detailData.isCurrentlyAssigned
                                    ? 'Current Assignment'
                                    : 'Latest Assignment'}
                            </h4>
                            <dl className={styles.assignmentMeta}>
                                <div>
                                    <dt>Timing</dt>
                                    <dd
                                        className={
                                            isDetailOverdue(detailData)
                                                ? styles.overdueText
                                                : undefined
                                        }
                                    >
                                        {formatDetailTiming(detailData, selectedMemberRow)}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Duration</dt>
                                    <dd>{formatDuration(detailData)}</dd>
                                </div>
                                <div>
                                    <dt>Start</dt>
                                    <dd>{formatDate(detailData.startDate)}</dd>
                                </div>
                                <div>
                                    <dt>Resolved End</dt>
                                    <dd>{formatDate(detailData.resolvedEndDate)}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className={styles.detailSection}>
                            <h4>Description</h4>
                            {sanitizedDescriptionHtml ? (
                                <div
                                    className={styles.descriptionRichText}
                                    dangerouslySetInnerHTML={{ __html: sanitizedDescriptionHtml }}
                                />
                            ) : (
                                <p>No description provided.</p>
                            )}
                        </div>

                        <div className={styles.detailSection}>
                            <h4>Skills</h4>
                            {Array.isArray(detailData.skills) && detailData.skills.length > 0 ? (
                                <div className={styles.skillList}>
                                    {detailData.skills.map(skill => (
                                        <span className={styles.skillPill} key={skill.id}>{skill.name}</span>
                                    ))}
                                </div>
                            ) : (
                                <p>No skills listed.</p>
                            )}
                        </div>

                        {hasWorkLinks(detailData.workLinks) && (
                            <div className={styles.workLinks}>
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
                    </div>
                )}
            </aside>

            <MemberHistoryModal
                member={selectedMemberRow}
                onClose={handleHistoryClose}
                open={isHistoryModalOpen}
            />
        </div>
    )
}

export default MembersView
