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
import classNames from 'classnames'

import { Button } from '~/libs/ui'

import {
    ArtifactsModal,
    Pagination,
    SubmissionHistoryModal,
    type SubmissionSortBy,
    SubmissionsTable,
} from '../../../../../lib/components'
import { PAGE_SIZE } from '../../../../../lib/constants'
import { WorkAppContext } from '../../../../../lib/contexts'
import {
    useDownloadAllSubmissions,
    useDownloadSubmission,
    useFetchSubmissions,
} from '../../../../../lib/hooks'
import { Challenge, Submission } from '../../../../../lib/models'
import { fetchMembersByUserIds } from '../../../../../lib/services'
import type { MemberProfile } from '../../../../../lib/services'
import {
    canDownloadSubmissions,
    showErrorToast,
} from '../../../../../lib/utils'
import { ReactComponent as LockIcon } from '../../../../../lib/assets/icons/lock.svg'

import styles from './SubmissionsSection.module.scss'

type SortOrder = 'asc' | 'desc'

type MemberCache = Record<string, MemberProfile | false>

interface DownloadAllItem {
    id: string
    legacySubmissionId?: string
}

interface FilterState {
    endDate: string
    handle: string
    minScore: string
    startDate: string
}

interface SubmissionsSectionProps {
    challenge: Challenge
    challengeId: string
}

function normalizeValue(value: unknown): string {
    return typeof value === 'string'
        ? value.trim()
        : ''
}

function normalizeChallengeTrack(challengeTrack: Challenge['track']): string {
    if (typeof challengeTrack === 'string') {
        return normalizeValue(challengeTrack)
    }

    if (typeof challengeTrack !== 'object' || !challengeTrack) {
        return ''
    }

    return normalizeValue(challengeTrack.track || challengeTrack.name || challengeTrack.abbreviation)
}

function normalizeChallengeType(challengeType: Challenge['type']): string {
    if (typeof challengeType === 'string') {
        return normalizeValue(challengeType)
    }

    if (typeof challengeType !== 'object' || !challengeType) {
        return ''
    }

    return normalizeValue(challengeType.name || challengeType.abbreviation)
}

function toOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value === 'string') {
        const parsedValue = Number(value)
        if (Number.isFinite(parsedValue)) {
            return parsedValue
        }
    }

    return undefined
}

function getCreatedAt(submission: Submission): string {
    return submission.createdAt
        || submission.created
        || submission.submissionTime
        || ''
}

function getInitialScore(submission: Submission): number {
    return toOptionalNumber(submission.review?.[0]?.score) || 0
}

function getFinalScore(submission: Submission): number {
    return toOptionalNumber(submission.reviewSummation?.[0]?.aggregateScore) || 0
}

function parseDateToTimestamp(value: string): number {
    const parsedValue = new Date(value)
    const timestamp = parsedValue.getTime()

    return Number.isFinite(timestamp)
        ? timestamp
        : 0
}

function resolveSortValue(
    submission: Submission,
    sortBy: SubmissionSortBy,
): number | string {
    if (sortBy === 'rating') {
        return toOptionalNumber(submission.rating) || 0
    }

    if (sortBy === 'memberHandle') {
        return normalizeValue(submission.memberHandle)
            .toLowerCase()
    }

    if (sortBy === 'email') {
        return normalizeValue(submission.email)
            .toLowerCase()
    }

    if (sortBy === 'status') {
        return normalizeValue(submission.status)
            .toLowerCase()
    }

    if (sortBy === 'initialScore') {
        return getInitialScore(submission)
    }

    if (sortBy === 'finalScore') {
        return getFinalScore(submission)
    }

    if (sortBy === 'submissionId') {
        return normalizeValue(submission.id)
            .toLowerCase()
    }

    return parseDateToTimestamp(getCreatedAt(submission))
}

function sortSubmissions(
    submissions: Submission[],
    sortBy: SubmissionSortBy,
    sortOrder: SortOrder,
): Submission[] {
    const sortedSubmissions = [...submissions]

    sortedSubmissions.sort((submissionA, submissionB) => {
        const valueA = resolveSortValue(submissionA, sortBy)
        const valueB = resolveSortValue(submissionB, sortBy)

        if (valueA === valueB) {
            return 0
        }

        if (sortOrder === 'asc') {
            return valueA > valueB
                ? 1
                : -1
        }

        return valueA > valueB
            ? -1
            : 1
    })

    return sortedSubmissions
}

function toOptionalBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'string') {
        const normalizedValue = value.trim()
            .toLowerCase()

        if (normalizedValue === 'true') {
            return true
        }

        if (normalizedValue === 'false') {
            return false
        }
    }

    return undefined
}

function getChallengeSubmissionViewable(challenge: Challenge): boolean {
    const directValue = toOptionalBoolean(challenge.submissionViewable)
    if (directValue !== undefined) {
        return directValue
    }

    if (!Array.isArray(challenge.metadata)) {
        return true
    }

    const metadataValue = challenge.metadata
        .find(metadataItem => normalizeValue(metadataItem.name) === 'submissionsViewable')
        ?.value

    return toOptionalBoolean(metadataValue) !== false
}

function getSubmissionMemberId(submission: Submission): string {
    return normalizeValue(submission.memberId)
}

function enrichSubmission(
    memberCache: MemberCache,
    submission: Submission,
): Submission {
    const memberId = getSubmissionMemberId(submission)
    const member = memberId
        ? memberCache[memberId]
        : undefined

    if (!member) {
        return submission
    }

    const nextRating = submission.rating !== undefined
        ? submission.rating
        : (member.rating || member.maxRating?.rating)

    return {
        ...submission,
        email: submission.email || member.email,
        memberHandle: submission.memberHandle || member.handle,
        rating: nextRating,
    }
}

function matchesFilterDateRange(
    submission: Submission,
    startDate: string,
    endDate: string,
): boolean {
    if (!startDate && !endDate) {
        return true
    }

    const createdAt = getCreatedAt(submission)
    if (!createdAt) {
        return false
    }

    const createdAtTimestamp = parseDateToTimestamp(createdAt)
    if (!createdAtTimestamp) {
        return false
    }

    if (startDate) {
        const minTimestamp = parseDateToTimestamp(startDate)
        if (minTimestamp && createdAtTimestamp < minTimestamp) {
            return false
        }
    }

    if (endDate) {
        const maxTimestamp = parseDateToTimestamp(`${endDate}T23:59:59.999Z`)
        if (maxTimestamp && createdAtTimestamp > maxTimestamp) {
            return false
        }
    }

    return true
}

function matchesFilterScore(submission: Submission, minScore: string): boolean {
    if (!minScore) {
        return true
    }

    const minimumScore = toOptionalNumber(minScore)
    if (minimumScore === undefined) {
        return true
    }

    return getFinalScore(submission) >= minimumScore
}

function matchesFilterHandle(submission: Submission, handleFilter: string): boolean {
    if (!handleFilter) {
        return true
    }

    const normalizedHandleFilter = normalizeValue(handleFilter)
        .toLowerCase()

    return normalizeValue(submission.memberHandle)
        .toLowerCase()
        .includes(normalizedHandleFilter)
}

function matchesFilters(submission: Submission, filters: FilterState): boolean {
    if (!matchesFilterHandle(submission, filters.handle)) {
        return false
    }

    if (!matchesFilterDateRange(submission, filters.startDate, filters.endDate)) {
        return false
    }

    return matchesFilterScore(submission, filters.minScore)
}

function toDownloadAllItems(submissions: Submission[]): DownloadAllItem[] {
    return submissions.map(submission => ({
        id: submission.id,
        legacySubmissionId: submission.legacySubmissionId,
    }))
}

function isFirst2Finish(challengeType: string): boolean {
    const normalizedType = challengeType
        .toLowerCase()
        .replace(/\s+/g, '')

    return normalizedType === 'first2finish'
}

function isBugHunt(tags: string[] | undefined): boolean {
    if (!Array.isArray(tags)) {
        return false
    }

    return tags.some(tag => normalizeValue(tag)
        .toLowerCase() === 'bug hunt')
}

export const SubmissionsSection: FC<SubmissionsSectionProps> = (
    props: SubmissionsSectionProps,
) => {
    const [filters, setFilters] = useState<FilterState>({
        endDate: '',
        handle: '',
        minScore: '',
        startDate: '',
    })
    const [memberCache, setMemberCache] = useState<MemberCache>({})
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(PAGE_SIZE)
    const [selectedHistorySubmission, setSelectedHistorySubmission] = useState<Submission | undefined>(undefined)
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('')
    const [showArtifactsModal, setShowArtifactsModal] = useState<boolean>(false)
    const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false)
    const [sortBy, setSortBy] = useState<SubmissionSortBy>('createdAt')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    const pendingMemberIdsRef = useRef<Set<string>>(new Set())

    const challengeTrack = normalizeChallengeTrack(props.challenge.track)
    const challengeType = normalizeChallengeType(props.challenge.type)
    const hideRatingColumn = isFirst2Finish(challengeType) || isBugHunt(props.challenge.tags)

    const workAppContext = useContext(WorkAppContext)
    const canDownload = canDownloadSubmissions(workAppContext.userRoles)

    const submissionsResult = useFetchSubmissions(
        props.challengeId,
        page,
        perPage,
        {
            fetchAll: true,
        },
    )
    const downloadAllResult = useDownloadAllSubmissions()
    const downloadSubmissionResult = useDownloadSubmission()

    const submissionViewable = getChallengeSubmissionViewable(props.challenge)
    const isDesignTrack = challengeTrack
        .toLowerCase() === 'design'

    const checkpointSubmissions = useMemo<Submission[]>(
        () => {
            if (Array.isArray(props.challenge.checkpoints)) {
                return props.challenge.checkpoints
            }

            return []
        },
        [props.challenge.checkpoints],
    )

    const memberIdsToLoad = useMemo<string[]>(() => {
        const allSubmissions = [
            ...submissionsResult.submissions,
            ...checkpointSubmissions,
        ]

        const uniqueIds = Array.from(new Set(allSubmissions
            .map(submission => getSubmissionMemberId(submission))
            .filter(Boolean)))

        return uniqueIds.filter(memberId => (
            memberCache[memberId] === undefined
            && !pendingMemberIdsRef.current.has(memberId)
        ))
    }, [checkpointSubmissions, memberCache, submissionsResult.submissions])

    useEffect(() => {
        if (!memberIdsToLoad.length) {
            return
        }

        memberIdsToLoad.forEach(memberId => pendingMemberIdsRef.current.add(memberId))

        fetchMembersByUserIds(memberIdsToLoad)
            .then(members => {
                setMemberCache(previousState => {
                    const nextState: MemberCache = {
                        ...previousState,
                    }

                    members.forEach(member => {
                        nextState[member.userId] = member
                        pendingMemberIdsRef.current.delete(member.userId)
                    })

                    memberIdsToLoad.forEach(memberId => {
                        if (nextState[memberId] === undefined) {
                            nextState[memberId] = false
                        }

                        pendingMemberIdsRef.current.delete(memberId)
                    })

                    return nextState
                })
            })
            .catch(() => {
                setMemberCache(previousState => {
                    const nextState: MemberCache = {
                        ...previousState,
                    }

                    memberIdsToLoad.forEach(memberId => {
                        nextState[memberId] = false
                        pendingMemberIdsRef.current.delete(memberId)
                    })

                    return nextState
                })
            })
    }, [memberIdsToLoad])

    useEffect(() => {
        setPage(1)
    }, [filters])

    const enrichedSubmissions = useMemo<Submission[]>(
        () => submissionsResult.submissions
            .map(submission => enrichSubmission(memberCache, submission)),
        [
            memberCache,
            submissionsResult.submissions,
        ],
    )

    const filteredSubmissions = useMemo<Submission[]>(() => (
        enrichedSubmissions.filter(submission => matchesFilters(submission, filters))
    ), [
        enrichedSubmissions,
        filters,
    ])

    const sortedSubmissions = useMemo<Submission[]>(() => sortSubmissions(
        filteredSubmissions,
        sortBy,
        sortOrder,
    ), [filteredSubmissions, sortBy, sortOrder])

    const paginatedSubmissions = useMemo<Submission[]>(() => {
        const startIndex = (page - 1) * perPage
        const endIndex = startIndex + perPage

        return sortedSubmissions.slice(startIndex, endIndex)
    }, [
        page,
        perPage,
        sortedSubmissions,
    ])

    const sortedCheckpointSubmissions = useMemo<Submission[]>(() => sortSubmissions(
        checkpointSubmissions.map(
            submission => enrichSubmission(memberCache, submission),
        ),
        sortBy,
        sortOrder,
    ), [
        checkpointSubmissions,
        memberCache,
        sortBy,
        sortOrder,
    ])

    const isMembersLoading = memberIdsToLoad.length > 0
    const paginationTotal = sortedSubmissions.length

    const handleDownloadAll = useCallback(async (): Promise<void> => {
        try {
            await downloadAllResult.downloadAll(toDownloadAllItems(submissionsResult.submissions))
        } catch {
            showErrorToast('Failed to download all submissions')
        }
    }, [
        downloadAllResult,
        submissionsResult.submissions,
    ])

    const handleDownloadSubmission = useCallback((submissionId: string): void => {
        downloadSubmissionResult.downloadSubmission(submissionId)
            .catch(() => undefined)
    }, [downloadSubmissionResult])

    const handleOpenArtifacts = useCallback((submissionId: string): void => {
        setSelectedSubmissionId(submissionId)
        setShowArtifactsModal(true)
    }, [])

    const handleCloseArtifacts = useCallback((): void => {
        setSelectedSubmissionId('')
        setShowArtifactsModal(false)
    }, [])

    const handleOpenHistory = useCallback((submission: Submission): void => {
        setSelectedHistorySubmission(submission)
        setShowHistoryModal(true)
    }, [])

    const handleCloseHistory = useCallback((): void => {
        setSelectedHistorySubmission(undefined)
        setShowHistoryModal(false)
    }, [])

    const handleSort = useCallback((fieldName: SubmissionSortBy): void => {
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
    const handlePerPageChange = useCallback((nextPerPage: number): void => {
        setPage(1)
        setPerPage(nextPerPage)
    }, [])

    const handleFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        const fieldName: string = event.target.name
        const fieldValue: string = event.target.value

        setFilters(currentFilters => ({
            ...currentFilters,
            [fieldName]: fieldValue,
        }))
    }, [])

    if (!submissionViewable && !canDownload) {
        return (
            <div className={classNames(styles.privateState, styles.container)}>
                <LockIcon className={styles.lockIcon} />
                <div className={styles.privateTitle}>Private Challenge</div>
                <div className={styles.privateSubtitle}>Submissions are not viewable for this challenge</div>
                <p className={styles.privateDescription}>
                    There are many reasons why submissions may not be viewable, such as stock-art
                    restrictions or client confidentiality.
                </p>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Submissions</h3>

                {canDownload
                    ? (
                        <Button
                            disabled={downloadAllResult.isDownloading}
                            label={downloadAllResult.isDownloading
                                ? `Downloading ${downloadAllResult.progress}%`
                                : 'Download All'}
                            onClick={handleDownloadAll}
                            primary
                            size='lg'
                        />
                    )
                    : undefined}
            </div>

            <div className={styles.filters}>
                <label className={styles.filterLabel} htmlFor='submission-handle-filter'>
                    Handle
                    <input
                        className={styles.filterInput}
                        id='submission-handle-filter'
                        name='handle'
                        onChange={handleFilterChange}
                        placeholder='Filter by handle'
                        type='text'
                        value={filters.handle}
                    />
                </label>

                <label className={styles.filterLabel} htmlFor='submission-start-date-filter'>
                    From
                    <input
                        className={styles.filterInput}
                        id='submission-start-date-filter'
                        name='startDate'
                        onChange={handleFilterChange}
                        type='date'
                        value={filters.startDate}
                    />
                </label>

                <label className={styles.filterLabel} htmlFor='submission-end-date-filter'>
                    To
                    <input
                        className={styles.filterInput}
                        id='submission-end-date-filter'
                        name='endDate'
                        onChange={handleFilterChange}
                        type='date'
                        value={filters.endDate}
                    />
                </label>

                <label className={styles.filterLabel} htmlFor='submission-min-score-filter'>
                    Min Score
                    <input
                        className={styles.filterInput}
                        id='submission-min-score-filter'
                        min='0'
                        name='minScore'
                        onChange={handleFilterChange}
                        placeholder='0'
                        step='0.01'
                        type='number'
                        value={filters.minScore}
                    />
                </label>
            </div>

            <div className={styles.tableWrapper}>
                <SubmissionsTable
                    canDownloadSubmissions={canDownload}
                    challengeId={props.challengeId}
                    hideRatingColumn={hideRatingColumn}
                    isLoading={submissionsResult.isLoading}
                    isLoadingMembers={isMembersLoading}
                    onDownloadSubmission={handleDownloadSubmission}
                    onOpenHistory={handleOpenHistory}
                    onOpenArtifacts={handleOpenArtifacts}
                    onSort={handleSort}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    submissionDownloadLoading={downloadSubmissionResult.isLoading}
                    submissions={paginatedSubmissions}
                />
            </div>

            {isDesignTrack && sortedCheckpointSubmissions.length > 0
                ? (
                    <div className={styles.checkpointSection}>
                        <h4 className={styles.checkpointTitle}>Round 1 (Checkpoint) Submissions</h4>
                        <SubmissionsTable
                            canDownloadSubmissions={canDownload}
                            challengeId={props.challengeId}
                            hideRatingColumn={hideRatingColumn}
                            isLoading={false}
                            isLoadingMembers={isMembersLoading}
                            onDownloadSubmission={handleDownloadSubmission}
                            onOpenHistory={handleOpenHistory}
                            onOpenArtifacts={handleOpenArtifacts}
                            onSort={handleSort}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            submissionDownloadLoading={downloadSubmissionResult.isLoading}
                            submissions={sortedCheckpointSubmissions}
                        />
                    </div>
                )
                : undefined}

            <div className={styles.paginationWrapper}>
                <Pagination
                    itemLabel='submissions'
                    onPageChange={setPage}
                    onPerPageChange={handlePerPageChange}
                    page={page}
                    perPage={perPage}
                    total={paginationTotal}
                />
            </div>

            {showHistoryModal && selectedHistorySubmission
                ? (
                    <SubmissionHistoryModal
                        challengeId={props.challengeId}
                        memberHandle={selectedHistorySubmission.memberHandle}
                        memberId={selectedHistorySubmission.memberId}
                        onClose={handleCloseHistory}
                        submissionId={selectedHistorySubmission.id}
                        submissionType={selectedHistorySubmission.type}
                    />
                )
                : undefined}

            {showArtifactsModal && selectedSubmissionId
                ? (
                    <ArtifactsModal
                        onClose={handleCloseArtifacts}
                        submissionId={selectedSubmissionId}
                    />
                )
                : undefined}
        </div>
    )
}

export default SubmissionsSection
