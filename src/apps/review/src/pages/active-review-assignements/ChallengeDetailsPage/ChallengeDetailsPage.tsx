/**
 * Challenge Details Page.
 */
import { kebabCase, startCase, toLower, toUpper, trim } from 'lodash'
import { FC, FocusEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useSWRConfig } from 'swr'
import classNames from 'classnames'
import moment from 'moment'

import { TableLoading } from '~/apps/admin/src/lib'
import { handleError } from '~/apps/admin/src/lib/utils'
import { EnvironmentConfig } from '~/config'
import { BaseModal, Button, InputCheckbox, InputDatePicker, InputText } from '~/libs/ui'
import { NotificationContextType, useNotification } from '~/libs/shared'

import {
    useFetchScreeningReview,
    useFetchScreeningReviewProps,
    useRole, useRoleProps } from '../../../lib/hooks'
import {
    ChallengeDetailContext,
    ChallengeDetailsContent,
    ChallengeLinks,
    ChallengePhaseInfo,
    ChallengeTimeline,
    ChallengeTimelineAction,
    ChallengeTimelineRow,
    PageWrapper,
    ReviewAppContext,
    TableNoRecord,
    TableRegistration,
    Tabs,
} from '../../../lib'
import {
    updateChallengePhase,
    UpdateChallengePhaseRequest,
    updatePhaseChangeNotifications,
} from '../../../lib/services'
import {
    BackendPhase,
    BackendResource,
    ChallengeDetailContextModel,
    ChallengeInfo,
    ReviewAppContextModel,
    SelectOption,
    SubmissionInfo,
} from '../../../lib/models'
import { REVIEWER, SUBMITTER, TAB, TABLE_DATE_FORMAT } from '../../../config/index.config'
import {
    buildPhaseTabs,
    findPhaseByTabLabel,
    isAppealsPhase,
    isAppealsResponsePhase,
} from '../../../lib/utils'
import type { PhaseLike, PhaseOrderingOptions } from '../../../lib/utils'
import {
    activeReviewAssignmentsRouteId,
    pastReviewAssignmentsRouteId,
    rootRoute,
} from '../../../config/routes.config'

import styles from './ChallengeDetailsPage.module.scss'

interface Props {
    className?: string
}

const normalizePhaseName = (name?: string): string => (name ? name.trim()
    .toLowerCase() : '')
const SUBMISSION_PHASE_NAMES = new Set(['submission', 'topgear submission'])
const REGISTRATION_PHASE_NAME = 'registration'
const POST_MORTEM_PHASE_KEY = 'post-mortem'

const isSubmissionDataTab = (label?: string): boolean => {
    const normalized = normalizePhaseName(label)
    if (!normalized) {
        return false
    }

    return normalized.includes('submission')
        || normalized.includes('screening')
        || normalized.includes('checkpoint')
        || normalized.includes('review')
        || normalized.includes('appeal')
        || normalized.includes('approval')
        || normalized.includes(POST_MORTEM_PHASE_KEY)
        || normalized.includes('post mortem')
}

const isReviewDataTab = (label?: string): boolean => {
    const normalized = normalizePhaseName(label)
    if (!normalized) {
        return false
    }

    return normalized.includes('review')
        || normalized.includes('appeal')
        || normalized.includes('approval')
        || normalized.includes(POST_MORTEM_PHASE_KEY)
        || normalized.includes('post mortem')
}

// Helpers to keep UI hooks simple and under complexity limits

// Compute a Set of this member's reviewer resource IDs (excluding iterative roles)
const getReviewerResourceIds = (myResources?: Array<{ id?: string; roleName?: string }> | null): Set<string> => new Set(
    (myResources || [])
        .filter(r => (r.roleName || '')
            .toLowerCase()
            .includes('reviewer')
            && !(r.roleName || '')
                .toLowerCase()
                .includes('iterative'))
        .map(r => r.id as string)
        .filter(Boolean) as string[],
)

// Compute a Set of this member's approver resource IDs
const getApproverResourceIds = (myResources?: Array<{ id?: string; roleName?: string }> | null): Set<string> => new Set(
    (myResources || [])
        .filter(r => (r.roleName || '')
            .toLowerCase()
            .includes('approver'))
        .map(r => r.id as string)
        .filter(Boolean) as string[],
)

// Determine whether a review has been completed/committed
const isReviewComplete = (
    review?: { committed?: boolean; status?: string | null },
): boolean => {
    const status = (review?.status || '').toUpperCase()
    if (status === 'COMPLETED') {
        return true
    }

    if (typeof review?.committed === 'boolean') {
        return review.committed
    }

    return false
}

// Determine review completion flags for tabs (any assignment and any pending)
const computeReviewCompletion = (
    review: Array<{ review?: { committed?: boolean; status?: string | null; resourceId?: string } }> | undefined,
    reviewerIds: Set<string>,
): { hasAnyReviewAssignment: boolean; hasAnyPendingReview: boolean } => {
    let hasAnyReviewAssignment = false
    let hasAnyPendingReview = false

    if (reviewerIds.size > 0) {
        for (const s of review || []) {
            const r = s.review
            const isMine = Boolean(r?.resourceId) && reviewerIds.has(r?.resourceId as string)
            if (isMine) {
                hasAnyReviewAssignment = true
                if (!isReviewComplete(r)) {
                    hasAnyPendingReview = true
                }
            }
        }
    }

    return { hasAnyPendingReview, hasAnyReviewAssignment }
}

// Determine approval completion flags for tabs (any assignment and any pending)
const computeApprovalCompletion = (
    approvalReviews: Array<{ review?: { id?: string; status?: string | null; resourceId?: string } }> | undefined,
    approverIds: Set<string>,
): { hasAnyApprovalAssignment: boolean; hasAnyPendingApproval: boolean } => {
    let hasAnyApprovalAssignment = false
    let hasAnyPendingApproval = false

    if (approverIds.size > 0) {
        for (const s of approvalReviews || []) {
            const r = s.review
            const isMine = Boolean(r?.id)
                && Boolean(r?.resourceId)
                && approverIds.has(r?.resourceId as string)
            if (isMine) {
                hasAnyApprovalAssignment = true
                const status = (r?.status || '').toUpperCase()
                if (status !== 'COMPLETED') {
                    hasAnyPendingApproval = true
                }
            }
        }
    }

    return { hasAnyApprovalAssignment, hasAnyPendingApproval }
}

// Determine whether there are appeals responses remaining for the reviewer and if complete
const computeAppealsResponse = (
    review: Array<{ review?: { id?: string; resourceId?: string } }> | undefined,
    reviewerIds: Set<string>,
    mappingReviewAppeal: Record<string, { totalAppeals?: number; finishAppeals?: number }> | undefined,
    challengeInfo: ChallengeInfo | undefined,
): { hasAppealsResponseObligation: boolean; appealsResponseComplete: boolean } => {
    let hasAppealsResponseObligation = false
    let appealsResponseComplete = false

    if (reviewerIds.size > 0 && isAppealsResponsePhase(challengeInfo)) {
        let remainingFound = false
        let anyReviewFound = false

        for (const s of review || []) {
            const r = s.review
            const belongsToMe = Boolean(r?.id)
                && (!r?.resourceId || reviewerIds.has(r?.resourceId as string))
            if (belongsToMe) {
                anyReviewFound = true
                const stat = r?.id ? mappingReviewAppeal?.[r.id] : undefined
                const total = stat?.totalAppeals ?? 0
                const finished = stat?.finishAppeals ?? 0
                const remaining = Math.max(total - finished, 0)
                if (remaining > 0) {
                    remainingFound = true
                }
            }
        }

        hasAppealsResponseObligation = anyReviewFound
        appealsResponseComplete = anyReviewFound && !remainingFound
    }

    return { appealsResponseComplete, hasAppealsResponseObligation }
}

// Determine completion flags for generic screening-like phases using Screening[] data
const computePhaseCompletionFromScreenings = (
    rows: Array<{ myReviewResourceId?: string; myReviewStatus?: string }> | undefined,
    myResourceIds: Set<string>,
): { hasAnyAssignment: boolean; hasAnyPending: boolean } => {
    let hasAnyAssignment = false
    let hasAnyPending = false
    if (myResourceIds.size > 0) {
        for (const s of rows || []) {
            const rid = s.myReviewResourceId
            if (rid && myResourceIds.has(rid)) {
                hasAnyAssignment = true
                const status = (s.myReviewStatus || '').toUpperCase()
                if (status !== 'COMPLETED') {
                    hasAnyPending = true
                }
            }
        }
    }

    return { hasAnyAssignment, hasAnyPending }
}

const isIterativeReviewPhaseName = (name?: string): boolean => (name || '')
    .toString()
    .toLowerCase()
    .includes('iterative review')

// (Phase dates display removed)

// eslint-disable-next-line complexity
export const ChallengeDetailsPage: FC<Props> = (props: Props) => {
    const { showBannerNotification, removeNotification }: NotificationContextType = useNotification()
    const [searchParams, setSearchParams] = useSearchParams()
    const location = useLocation()
    const navigate = useNavigate()
    const searchParamsString = useMemo(() => searchParams.toString(), [searchParams])
    const swrConfig = useSWRConfig()
    const mutate = swrConfig.mutate

    // get challenge info from challenge detail context
    const {
        challengeId,
        challengeInfo,
        isLoadingChallengeInfo,
        isLoadingChallengeResources,
        resources,
        myResources,
        challengeSubmissions,
        isLoadingChallengeSubmissions,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
    const { actionChallengeRole }: useRoleProps = useRole()
    const hasChallengeInfo = Boolean(challengeInfo)
    const challengeStatus = challengeInfo?.status?.toUpperCase()

    // get challenge screening, review data
    const {
        approvalMinimumPassingScore,
        approvalReviews,
        checkpoint,
        checkpointReview,
        checkpointReviewMinimumPassingScore,
        checkpointScreeningMinimumPassingScore,
        isLoading: isLoadingSubmission,
        isLoadingReviews,
        mappingReviewAppeal,
        postMortemMinimumPassingScore,
        postMortemReviews,
        review,
        reviewMinimumPassingScore,
        reviewProgress,
        screening,
        screeningMinimumPassingScore,
        submitterReviews,
    }: useFetchScreeningReviewProps = useFetchScreeningReview()

    const visibleSubmissions = useMemo(
        () => (isLoadingChallengeSubmissions ? [] : challengeSubmissions),
        [challengeSubmissions, isLoadingChallengeSubmissions],
    )

    const [tabItems, setTabItems] = useState<SelectOption[]>([])
    const [selectedTab, setSelectedTab] = useState<string>('')
    const isPastReviewDetail = useMemo(
        () => location.pathname.includes(`/${pastReviewAssignmentsRouteId}/`),
        [location.pathname],
    )
    const tabItemsWithLoading = useMemo(() => {
        if (!tabItems.length) {
            return tabItems
        }

        return tabItems.map(item => {
            const showIndicator = (isSubmissionDataTab(item.value) && isLoadingChallengeSubmissions)
                || (isReviewDataTab(item.value) && isLoadingReviews)
            if (!showIndicator) {
                return item
            }

            const indicator = (
                <>
                    {item.indicator}
                    <span className={styles.tabLoadingIndicator} aria-hidden='true' />
                </>
            )

            return { ...item, indicator }
        })
    }, [isLoadingChallengeSubmissions, isLoadingReviews, tabItems])
    const latestReview = review.find(r => r.isLatest)
    const reviewInProgress = latestReview?.review?.status === 'IN_PROGRESS'
    const currentUserResource = useMemo<BackendResource | undefined>(() => myResources
        .find(resource => typeof resource.phaseChangeNotifications === 'boolean')
        ?? myResources[0], [myResources])
    const currentUserResourceId = currentUserResource?.id
    const resourcesCacheKey = useMemo(
        () => (challengeId
            ? `resourceBaseUrl/resources?challengeId=${challengeId}`
            : undefined),
        [challengeId],
    )
    const challengeInfoCacheKey = useMemo(
        () => (challengeId
            ? `challengeBaseUrl/challenges/${challengeId}`
            : undefined),
        [challengeId],
    )
    const [phaseNotificationsEnabled, setPhaseNotificationsEnabled] = useState<boolean>(
        currentUserResource?.phaseChangeNotifications ?? false,
    )
    const [isSavingPhaseNotifications, setIsSavingPhaseNotifications] = useState(false)
    const [phaseActionLoadingMap, setPhaseActionLoadingMap] = useState<Record<string, boolean>>({})
    const [extendTarget, setExtendTarget] = useState<{
        id: string
        name: string
        duration?: number
        actualStartDate?: string
        scheduledStartDate?: string
        actualEndDate?: string
        scheduledEndDate?: string
    }>()
    const [extendSelectedEndDate, setExtendSelectedEndDate] = useState<Date | undefined>()
    const [extendError, setExtendError] = useState<string | undefined>()
    const [reopenTarget, setReopenTarget] = useState<{
        id: string
        name: string
        duration?: number
        actualStartDate?: string
        actualEndDate?: string
    }>()
    const [reopenSelectedEndDate, setReopenSelectedEndDate] = useState<Date | undefined>(undefined)
    const [reopenError, setReopenError] = useState<string | undefined>()

    // eslint-disable-next-line complexity
    useEffect(() => {
        setPhaseNotificationsEnabled(currentUserResource?.phaseChangeNotifications ?? false)
    }, [currentUserResource?.phaseChangeNotifications])

    const noop = useCallback(() => undefined, [])

    const togglePhaseNotifications = useCallback(async () => {
        if (!currentUserResourceId || isSavingPhaseNotifications) {
            return
        }

        const nextValue = !phaseNotificationsEnabled
        const previousValue = phaseNotificationsEnabled

        setPhaseNotificationsEnabled(nextValue)
        setIsSavingPhaseNotifications(true)

        try {
            await updatePhaseChangeNotifications(currentUserResourceId, nextValue)

            if (resourcesCacheKey) {
                await mutate(
                    resourcesCacheKey,
                    (current: BackendResource[] | undefined) => {
                        if (!current) {
                            return current
                        }

                        return current.map(resource => (resource.id === currentUserResourceId
                            ? {
                                ...resource,
                                phaseChangeNotifications: nextValue,
                            }
                            : resource))
                    },
                    false,
                )

                await mutate(resourcesCacheKey)
            }

            toast.success(
                `Phase notifications ${nextValue ? 'enabled' : 'disabled'}.`,
                {
                    toastId: `phase-notifications-${currentUserResourceId}`,
                },
            )
        } catch (error) {
            setPhaseNotificationsEnabled(previousValue)
            handleError(error as Error)
            toast.error('Failed to update phase notifications.', {
                toastId: `phase-notifications-error-${currentUserResourceId}`,
            })
        } finally {
            setIsSavingPhaseNotifications(false)
        }
    }, [
        currentUserResourceId,
        isSavingPhaseNotifications,
        mutate,
        phaseNotificationsEnabled,
        resourcesCacheKey,
    ])

    const shouldShowPhaseNotificationToggle = useMemo(
        () => !isPastReviewDetail && Boolean(currentUserResourceId),
        [isPastReviewDetail, currentUserResourceId],
    )
    const isPhaseNotificationToggleDisabled = isSavingPhaseNotifications
        || isLoadingChallengeResources

    const listRouteId = isPastReviewDetail
        ? pastReviewAssignmentsRouteId
        : activeReviewAssignmentsRouteId
    const listLabel = isPastReviewDetail
        ? 'My Past Challenges'
        : 'Active Challenges'
    const listPath = `${rootRoute}/${listRouteId}/`
    const breadCrumb = useMemo(
        () => [
            {
                index: 1,
                label: listLabel,
                path: listPath,
            },
            ...(isLoadingChallengeInfo
                ? []
                : [{ index: 2, label: challengeInfo?.name ?? '' }]),
        ],
        [
            challengeInfo,
            isLoadingChallengeInfo,
            listLabel,
            listPath,
        ],
    )

    const switchTab = useCallback((tab: string) => {
        setSelectedTab(tab)
        setSearchParams({ tab: kebabCase(tab) })
    }, [setSearchParams])

    // Redirect: if user is on a past-challenges route but the challenge is ACTIVE,
    // send them to the corresponding active-challenges route, preserving the rest of the path and query.
    useEffect(() => {
        if (!hasChallengeInfo || !challengeId || !isPastReviewDetail) {
            return
        }

        const isActiveChallenge = challengeStatus === 'ACTIVE'
        if (!isActiveChallenge) {
            return
        }

        const pastPrefix = `/${pastReviewAssignmentsRouteId}/`
        const activePrefix = `/${activeReviewAssignmentsRouteId}/`
        const idx = location.pathname.indexOf(pastPrefix)
        if (idx < 0) {
            return
        }

        const before = location.pathname.slice(0, idx)
        const after = location.pathname.slice(idx + pastPrefix.length)
        const targetPath = `${before}${activePrefix}${after}`
        const targetUrl = `${targetPath}${searchParamsString ? `?${searchParamsString}` : ''}`
        navigate(targetUrl, { replace: true })
    }, [
        challengeId,
        challengeStatus,
        hasChallengeInfo,
        isPastReviewDetail,
        location.pathname,
        navigate,
        searchParamsString,
    ])

    useEffect(() => {
        if (!hasChallengeInfo || !challengeId || isPastReviewDetail) {
            return
        }

        const isEndedChallenge = challengeStatus === 'COMPLETED'
            || (challengeStatus?.startsWith('CANCELLED') ?? false)

        if (!isEndedChallenge) {
            return
        }

        const normalizedRootRoute = rootRoute.startsWith('/')
            ? rootRoute.slice(1)
            : rootRoute
        const pastChallengePathSegments = [
            normalizedRootRoute,
            pastReviewAssignmentsRouteId,
            challengeId,
            'challenge-details',
        ].filter(Boolean)
        const pastChallengePath = `/${pastChallengePathSegments.join('/')}`
        const targetUrl = `${pastChallengePath}${searchParamsString ? `?${searchParamsString}` : ''}`

        navigate(targetUrl, { replace: true })
    }, [
        challengeId,
        challengeStatus,
        hasChallengeInfo,
        isPastReviewDetail,
        navigate,
        searchParamsString,
    ])

    const formatChallengeStatusLabel = useCallback((rawStatus?: string): string | undefined => {
        if (!rawStatus) return undefined
        const normalized = toUpper(trim(rawStatus))

        if (normalized === 'COMPLETED') {
            return 'Completed'
        }

        if (normalized === 'CANCELLED') {
            return 'Cancelled'
        }

        if (normalized.startsWith('CANCELLED_')) {
            const reason = normalized.slice('CANCELLED_'.length)
            const prettyReason = startCase(toLower(reason))
            return `Cancelled: ${prettyReason}`
        }

        // Fallback to a readable Title Case
        return startCase(toLower(normalized))
    }, [])

    const statusPillClass = useMemo(() => {
        if (!challengeStatus) return undefined
        if (challengeStatus === 'COMPLETED') return styles.statusPillCompleted
        if (challengeStatus.startsWith('CANCELLED')) return styles.statusPillCancelled
        return undefined
    }, [challengeStatus])

    const trackTypePills = useMemo(() => {
        const pills: string[] = []
        const trackName = trim(challengeInfo?.track?.name ?? '')

        if (trackName) {
            pills.push(`Track: ${trackName}`)
        }

        const typeName = trim(challengeInfo?.type?.name ?? '')

        if (typeName) {
            pills.push(`Type: ${typeName}`)
        }

        return pills
    }, [challengeInfo?.track?.name, challengeInfo?.type?.name])

    const phaseOrderingOptions = useMemo<PhaseOrderingOptions>(() => {
        const typeName = challengeInfo?.type?.name?.toLowerCase?.() || ''
        const typeAbbrev = challengeInfo?.type?.abbreviation?.toLowerCase?.() || ''
        const simplifiedType = typeName.replace(/\s|-/g, '')
        const isTopgearTask = simplifiedType === 'topgeartask'
        return {
            isF2F: typeAbbrev === 'f2f' || simplifiedType === 'first2finish',
            isTask: !isTopgearTask && (typeAbbrev === 'task' || typeAbbrev === 'tsk' || simplifiedType === 'task'),
            isTopgearTask,
        }
    }, [challengeInfo?.type?.abbreviation, challengeInfo?.type?.name])

    const visibleChallengePhases = useMemo<BackendPhase[]>(() => {
        const phases = challengeInfo?.phases ?? []
        if (!phaseOrderingOptions.isTopgearTask || phases.length === 0) {
            return phases
        }

        const normalizeId = (value: unknown): string | undefined => {
            if (value === undefined || value === null) {
                return undefined
            }

            const normalized = String(value)
                .trim()
            return normalized || undefined
        }

        const activityPhaseIds = new Set<string>()
        const collectPhaseIds = (submissions?: SubmissionInfo[]): void => {
            submissions?.forEach(submission => {
                const phaseId = normalizeId(submission?.review?.phaseId)
                if (phaseId) {
                    activityPhaseIds.add(phaseId)
                }
            })
        }

        collectPhaseIds(review)
        collectPhaseIds(submitterReviews)

        const iterativePhases = phases.filter(phase => isIterativeReviewPhaseName(phase?.name))
        if (!iterativePhases.length) {
            return phases
        }

        const sortedIterative = iterativePhases
            .slice()
            .sort((a, b) => {
                const startA = Date.parse(a.actualStartDate || a.scheduledStartDate || '')
                const startB = Date.parse(b.actualStartDate || b.scheduledStartDate || '')
                const validA = Number.isFinite(startA)
                const validB = Number.isFinite(startB)
                if (validA && validB && startA !== startB) {
                    return startA - startB
                }

                return 0
            })

        const hasActualTimestamps = (phase: BackendPhase): boolean => Boolean(
            normalizeId(phase.actualStartDate)
            || normalizeId(phase.actualEndDate),
        )

        const phaseHasActivity = (phase: BackendPhase): boolean => {
            const candidateKeys = [
                normalizeId(phase.id),
                normalizeId(phase.phaseId),
            ].filter(Boolean) as string[]

            return candidateKeys.some(key => activityPhaseIds.has(key))
        }

        const primaryIterative = sortedIterative.find(phase => (
            phase?.isOpen
            || hasActualTimestamps(phase)
            || phaseHasActivity(phase)
        )) ?? sortedIterative[0]

        const shouldKeep = (phase: BackendPhase): boolean => {
            if (!isIterativeReviewPhaseName(phase?.name)) {
                return true
            }

            if (primaryIterative && phase === primaryIterative) {
                return true
            }

            if (phase.isOpen) {
                return true
            }

            if (hasActualTimestamps(phase)) {
                return true
            }

            if (phaseHasActivity(phase)) {
                return true
            }

            return false
        }

        const filtered = phases.filter(shouldKeep)
        return filtered.length ? filtered : phases
    }, [challengeInfo?.phases, phaseOrderingOptions.isTopgearTask, review, submitterReviews])

    useEffect(() => {
        if (!tabItems.length) return

        let nextTab: string | undefined

        const tab = searchParams.get('tab')
        if (tab) {
            const match = tabItems.find(item => kebabCase(item.value) === tab)
            if (match) {
                nextTab = match.value
            }
        }

        if (!nextTab && !isPastReviewDetail) {
            const challengePhases = visibleChallengePhases
            if (challengePhases.length) {
                let openTabValue: string | undefined
                tabItems.forEach(item => {
                    const phase = findPhaseByTabLabel(challengePhases, item.value, phaseOrderingOptions)
                    if (phase?.isOpen) {
                        openTabValue = item.value
                    }
                })
                if (openTabValue) {
                    nextTab = openTabValue
                }
            }
        }

        if (!nextTab) {
            nextTab = tabItems[0]?.value
        }

        if (nextTab && nextTab !== selectedTab) {
            setSelectedTab(nextTab)
            sessionStorage.setItem(TAB, nextTab)
        }
    }, [
        searchParams,
        tabItems,
        visibleChallengePhases,
        phaseOrderingOptions,
        isPastReviewDetail,
        selectedTab,
    ])

    // eslint-disable-next-line complexity
    useEffect(() => {
        if (!challengeInfo) return
        if (phaseOrderingOptions.isTask && !phaseOrderingOptions.isTopgearTask) {
            setTabItems(prev => (prev.length ? [] : prev))
            return
        }

        const challengePhases = visibleChallengePhases
        const items = buildPhaseTabs(
            challengePhases,
            challengeInfo.status,
            phaseOrderingOptions,
        )

        // Only add indicators on active-challenges view
        if (isPastReviewDetail) {
            setTabItems(items)
            return
        }

        // Map tab labels to the corresponding phase so we can check whether it is currently open
        const tabPhaseMap = new Map<string, PhaseLike | undefined>()
        items.forEach(tab => {
            tabPhaseMap.set(
                tab.value,
                findPhaseByTabLabel(challengePhases, tab.value, phaseOrderingOptions),
            )
        })

        const myReviewerResourceIds = new Set(
            (myResources || [])
                .filter(r => {
                    const n = (r.roleName || '').toLowerCase()
                    return n.includes('reviewer') && !n.includes('iterative')
                })
                .map(r => r.id),
        )
        const myScreenerResourceIds = new Set(
            (myResources || [])
                .filter(r => {
                    const n = (r.roleName || '').toLowerCase()
                    return n.includes('screener') && !n.includes('checkpoint')
                })
                .map(r => r.id),
        )
        const myCheckpointScreenerResourceIds = new Set(
            (myResources || [])
                .filter(r => (r.roleName || '').toLowerCase() === 'checkpoint screener')
                .map(r => r.id),
        )
        const myCheckpointReviewerResourceIds = new Set(
            (myResources || [])
                .filter(r => (r.roleName || '').toLowerCase() === 'checkpoint reviewer')
                .map(r => r.id),
        )

        // Pending state per phase
        const {
            hasAnyPendingReview: pendingReview,
        }: { hasAnyPendingReview: boolean } = computeReviewCompletion(
            review,
            myReviewerResourceIds,
        )
        const {
            hasAnyPendingReview: pendingPostMortem,
        }: { hasAnyPendingReview: boolean } = computeReviewCompletion(
            postMortemReviews,
            myReviewerResourceIds,
        )

        const pendingScreening = (() => {
            if (myScreenerResourceIds.size === 0) return false
            return (screening || []).some(s => (
                s.myReviewResourceId && myScreenerResourceIds.has(s.myReviewResourceId)
                && ((s.myReviewStatus || '').toUpperCase() !== 'COMPLETED')
            ))
        })()

        const pendingCheckpointScreening = (() => {
            if (myCheckpointScreenerResourceIds.size === 0) return false
            return (checkpoint || []).some(s => (
                s.myReviewResourceId && myCheckpointScreenerResourceIds.has(s.myReviewResourceId)
                && ((s.myReviewStatus || '').toUpperCase() !== 'COMPLETED')
            ))
        })()

        const pendingCheckpointReview = (() => {
            if (myCheckpointReviewerResourceIds.size === 0) return false
            return (checkpointReview || []).some(s => (
                s.myReviewResourceId && myCheckpointReviewerResourceIds.has(s.myReviewResourceId)
                && ((s.myReviewStatus || '').toUpperCase() !== 'COMPLETED')
            ))
        })()

        // Start with base items; add warnings per label if the viewer has obligations pending
        const flagged = items.map(it => {
            const label = it.value.trim()
                .toLowerCase()
            const phaseForTab = tabPhaseMap.get(it.value)
            if (!phaseForTab?.isOpen) {
                return it
            }

            if (label === 'review' && pendingReview) {
                return { ...it, warning: true }
            }

            if (label === 'screening' && pendingScreening) {
                return { ...it, warning: true }
            }

            if (label === 'checkpoint screening' && pendingCheckpointScreening) {
                return { ...it, warning: true }
            }

            if (label === 'checkpoint review' && pendingCheckpointReview) {
                return { ...it, warning: true }
            }

            if (label === 'post-mortem' && pendingPostMortem) {
                return { ...it, warning: true }
            }

            return it
        })

        // Reviewer view: if current phase is Appeals Response and there are any remaining
        // appeal responses for this reviewer, flag the 'Appeals Response' tab.
        let finalItems = flagged
        if (actionChallengeRole === REVIEWER && isAppealsResponsePhase(challengeInfo)) {

            // Compute whether any of my reviews still have remaining appeals to respond to
            const hasRemainingAppealResponses = (review || []).some(s => {
                const r = s.review
                if (!r?.id) return false
                if (r.resourceId && !myReviewerResourceIds.has(r.resourceId)) return false
                const stat = (mappingReviewAppeal?.[r.id])
                const total = stat?.totalAppeals ?? 0
                const finished = stat?.finishAppeals ?? 0
                const remaining = Math.max(total - finished, 0)
                return remaining > 0
            })

            if (hasRemainingAppealResponses) {
                finalItems = flagged.map(it => {
                    const normalized = it.value
                        .trim()
                        .toLowerCase()
                    const phaseForTab = tabPhaseMap.get(it.value)
                    if (!phaseForTab?.isOpen) {
                        return it
                    }

                    return normalized === 'appeals response'
                        ? { ...it, warning: true }
                        : it
                })
            }
        }

        // Submitter view: if Appeals is open and the member has a review they can appeal,
        // add a warning indicator to the Appeals tab.
        if (actionChallengeRole === SUBMITTER) {
            const appealsOpen = isAppealsPhase(challengeInfo)
            if (appealsOpen) {
                const hasAnyReview = (submitterReviews ?? []).some(
                    s => (
                        (s.reviews && s.reviews.length > 0)
                        || Boolean(s.review?.id)
                    ),
                )
                if (hasAnyReview) {
                    finalItems = finalItems.map(it => {
                        const normalizedValue = it.value
                            .trim()
                            .toLowerCase()
                        const phaseForTab = tabPhaseMap.get(it.value)
                        if (!phaseForTab?.isOpen) {
                            return it
                        }

                        return normalizedValue === 'appeals'
                            ? { ...it, warning: true }
                            : it
                    })
                }
            }
        }

        setTabItems(finalItems)
    }, [
        challengeInfo,
        actionChallengeRole,
        review,
        submitterReviews,
        myResources,
        mappingReviewAppeal,
        phaseOrderingOptions,
        screening,
        checkpoint,
        checkpointReview,
        isPastReviewDetail,
        visibleChallengePhases,
        postMortemReviews,
    ])

    // Add completion indicators for active challenges on relevant tabs
    // eslint-disable-next-line complexity
    useEffect(() => {
        if (!challengeInfo || !tabItems.length || isPastReviewDetail) return
        if (phaseOrderingOptions.isTask && !phaseOrderingOptions.isTopgearTask) return

        const norm = (s: string): string => s.trim()
            .toLowerCase()

        const reviewerIds = getReviewerResourceIds(myResources)
        const approverIds = getApproverResourceIds(myResources)
        const {
            hasAnyReviewAssignment,
            hasAnyPendingReview,
        }: { hasAnyReviewAssignment: boolean; hasAnyPendingReview: boolean } = computeReviewCompletion(
            review,
            reviewerIds,
        )
        const {
            hasAnyReviewAssignment: hasAnyPostMortemAssignment,
            hasAnyPendingReview: hasAnyPendingPostMortem,
        }: { hasAnyReviewAssignment: boolean; hasAnyPendingReview: boolean } = computeReviewCompletion(
            postMortemReviews,
            reviewerIds,
        )
        const {
            hasAnyApprovalAssignment,
            hasAnyPendingApproval,
        }: { hasAnyApprovalAssignment: boolean; hasAnyPendingApproval: boolean } = computeApprovalCompletion(
            approvalReviews,
            approverIds,
        )
        const {
            hasAppealsResponseObligation,
            appealsResponseComplete,
        }: { hasAppealsResponseObligation: boolean; appealsResponseComplete: boolean } = computeAppealsResponse(
            review,
            reviewerIds,
            mappingReviewAppeal as Record<string, { totalAppeals?: number; finishAppeals?: number }> | undefined,
            challengeInfo,
        )

        // Compute completion for Screening/Checkpoint phases using my assignment markers
        const myScreenerIds = new Set(
            (myResources || [])
                .filter(r => {
                    const n = (r.roleName || '').toLowerCase()
                    return n.includes('screener') && !n.includes('checkpoint')
                })
                .map(r => r.id as string),
        )
        const myCheckpointScreenerIds = new Set(
            (myResources || [])
                .filter(r => (r.roleName || '').toLowerCase() === 'checkpoint screener')
                .map(r => r.id as string),
        )
        const myCheckpointReviewerIds = new Set(
            (myResources || [])
                .filter(r => (r.roleName || '').toLowerCase() === 'checkpoint reviewer')
                .map(r => r.id as string),
        )

        const {
            hasAnyAssignment: hasAnyScreeningAssignment,
            hasAnyPending: hasAnyPendingScreening,
        }: { hasAnyAssignment: boolean; hasAnyPending: boolean }
            = computePhaseCompletionFromScreenings(screening, myScreenerIds)
        const {
            hasAnyAssignment: hasAnyCheckpointScreeningAssignment,
            hasAnyPending: hasAnyPendingCheckpointScreening,
        }: { hasAnyAssignment: boolean; hasAnyPending: boolean }
            = computePhaseCompletionFromScreenings(checkpoint, myCheckpointScreenerIds)
        const {
            hasAnyAssignment: hasAnyCheckpointReviewAssignment,
            hasAnyPending: hasAnyPendingCheckpointReview,
        }: { hasAnyAssignment: boolean; hasAnyPending: boolean }
            = computePhaseCompletionFromScreenings(checkpointReview, myCheckpointReviewerIds)

        const iterativeReviewCompleted = hasAnyReviewAssignment && !hasAnyPendingReview
        const completedLabels = new Set<string>([
            ...(iterativeReviewCompleted ? ['review'] : []),
            ...((hasAppealsResponseObligation && appealsResponseComplete) ? ['appeals response'] : []),
            ...((hasAnyApprovalAssignment && !hasAnyPendingApproval) ? ['approval'] : []),
            ...((hasAnyScreeningAssignment && !hasAnyPendingScreening) ? ['screening'] : []),
            ...((hasAnyCheckpointScreeningAssignment && !hasAnyPendingCheckpointScreening)
                ? ['checkpoint screening']
                : []),
            ...((hasAnyCheckpointReviewAssignment && !hasAnyPendingCheckpointReview)
                ? ['checkpoint review']
                : []),
            ...((hasAnyPostMortemAssignment && !hasAnyPendingPostMortem) ? ['post-mortem'] : []),
        ])

        const isCompletedLabel = (label: string): boolean => (
            completedLabels.has(label)
            || (iterativeReviewCompleted && label.startsWith('iterative review'))
        )

        const nextItems = tabItems.map(item => {
            const label = norm(item.value)
            if (isCompletedLabel(label)) {
                return { ...item, completed: true, warning: false }
            }

            return item
        })

        const changed = nextItems.some((n, idx) => (
            n.completed !== tabItems[idx].completed
        ) || (
            n.warning !== tabItems[idx].warning
        ))
        if (changed) {
            setTabItems(nextItems)
        }
    }, [
        tabItems,
        isPastReviewDetail,
        myResources,
        review,
        mappingReviewAppeal,
        challengeInfo,
        approvalReviews,
        screening,
        checkpoint,
        checkpointReview,
        phaseOrderingOptions,
        postMortemReviews,
    ])

    // Determine if current user should see the Resources section
    const hasCopilotRole = useMemo(
        () => (myResources ?? [])
            .some(resource => {
                const roleName = resource.roleName ?? ''
                const normalizedRole = roleName
                    ?.toLowerCase()
                    .replace(/[^a-z]/g, '')
                return normalizedRole?.includes('copilot') ?? false
            }),
        [myResources],
    )
    const hasManagerRole = useMemo(
        () => (myResources ?? [])
            .some(resource => (resource.roleName ?? '')
                .trim()
                .toLowerCase() === 'manager'),
        [myResources],
    )
    const isAdmin = useMemo(
        () => loginUserInfo?.roles?.some(
            role => typeof role === 'string' && role.toLowerCase() === 'administrator',
        ) ?? false,
        [loginUserInfo?.roles],
    )
    const shouldShowResourcesSection = hasCopilotRole || hasManagerRole || isAdmin
    const canManagePhases = useMemo(
        () => !isPastReviewDetail && (hasCopilotRole || isAdmin),
        [hasCopilotRole, isAdmin, isPastReviewDetail],
    )

    const challengePhases = challengeInfo?.phases

    const phaseLookup = useMemo(() => {
        const map = new Map<string, BackendPhase>()
        if (challengePhases) {
            challengePhases.forEach(phaseItem => {
                if (phaseItem.id) {
                    map.set(phaseItem.id, phaseItem)
                }

                if (phaseItem.phaseId) {
                    map.set(phaseItem.phaseId, phaseItem)
                }
            })
        }

        return map
    }, [challengePhases])

    const reopenEligiblePhaseIds = useMemo(() => {
        const allowed = new Set<string>()
        if (!challengePhases?.length) {
            return allowed
        }

        const addPhaseIdentifiers = (phase?: BackendPhase): void => {
            if (!phase) {
                return
            }

            if (phase.id) {
                allowed.add(phase.id)
            }

            if (phase.phaseId) {
                allowed.add(phase.phaseId)
            }
        }

        challengePhases.forEach(phase => {
            if (!phase?.isOpen || !phase.predecessor) {
                return
            }

            allowed.add(phase.predecessor)
            addPhaseIdentifiers(phaseLookup.get(phase.predecessor))
        })

        const hasSubmissionVariantOpen = challengePhases.some(phase => (
            phase?.isOpen && SUBMISSION_PHASE_NAMES.has(normalizePhaseName(phase.name))
        ))

        if (hasSubmissionVariantOpen) {
            challengePhases.forEach(phase => {
                if (normalizePhaseName(phase?.name) === REGISTRATION_PHASE_NAME) {
                    addPhaseIdentifiers(phase)
                }
            })
        }

        return allowed
    }, [challengePhases, phaseLookup])

    const timelineRows = useMemo<ChallengeTimelineRow[]>(() => {
        if (phaseOrderingOptions.isTask && !phaseOrderingOptions.isTopgearTask) {
            return []
        }

        if (!visibleChallengePhases.length) {
            return []
        }

        const baseItems = buildPhaseTabs(
            visibleChallengePhases,
            challengeInfo?.status,
            phaseOrderingOptions,
        )
        const seen = new Set<string>()
        const nowMs = Date.now()

        const formatDate = (value?: string): string => {
            if (!value) return '-'
            const parsed = moment(value)
            if (!parsed.isValid()) return '-'
            return parsed
                .local()
                .format(TABLE_DATE_FORMAT)
        }

        const rows: ChallengeTimelineRow[] = []
        baseItems.forEach(item => {
            const phase = findPhaseByTabLabel(
                visibleChallengePhases,
                item.value,
                phaseOrderingOptions,
            )

            if (!phase) return

            const displayName = item.label
                || item.value
                || phase.name
                || 'Unnamed Phase'

            const uniqueKey = phase.id
                || `${phase.name}-${phase.scheduledStartDate}-${phase.actualStartDate}`
            if (seen.has(uniqueKey)) {
                return
            }

            seen.add(uniqueKey)

            const startSource = phase.actualStartDate || phase.scheduledStartDate
            const endSource = phase.actualEndDate || phase.scheduledEndDate
            const actualEndMs = phase.actualEndDate ? Date.parse(phase.actualEndDate) : NaN
            const hasPastActualEnd = Number.isFinite(actualEndMs) && actualEndMs < nowMs

            const status = (() => {
                if (phase.isOpen) return 'Open'
                if (!phase.isOpen && hasPastActualEnd) return 'Closed'
                if (!phase.isOpen && !phase.actualStartDate) return 'Pending'
                return 'Closed'
            })()

            rows.push({
                duration: typeof phase.duration === 'number' ? phase.duration : undefined,
                end: formatDate(endSource),
                id: phase.id || phase.phaseId,
                name: displayName,
                start: formatDate(startSource),
                status,
            })
        })

        return rows
    }, [challengeInfo, phaseOrderingOptions, visibleChallengePhases])

    const setPhaseActionLoading = useCallback((phaseId: string, loading: boolean) => {
        setPhaseActionLoadingMap(prev => ({
            ...prev,
            [phaseId]: loading,
        }))
    }, [])

    const handlePhaseUpdate = useCallback(async (
        phaseId: string,
        payload: UpdateChallengePhaseRequest,
        messages: { success: string; error: string; toastId: string },
    ): Promise<boolean> => {
        if (!phaseId || !challengeId) {
            return false
        }

        setPhaseActionLoading(phaseId, true)

        try {
            await updateChallengePhase(challengeId, phaseId, payload)

            if (challengeInfoCacheKey) {
                await mutate(challengeInfoCacheKey)
            }

            toast.success(messages.success, {
                toastId: `challenge-phase-${phaseId}-${messages.toastId}`,
            })

            return true
        } catch (error) {
            handleError(error as Error)
            toast.error(messages.error, {
                toastId: `challenge-phase-${phaseId}-${messages.toastId}-error`,
            })

            return false
        } finally {
            setPhaseActionLoading(phaseId, false)
        }
    }, [challengeId, challengeInfoCacheKey, mutate, setPhaseActionLoading])

    const openExtendModal = useCallback((
        phaseId: string,
        phaseName: string,
        duration?: number,
    ) => {
        const phaseData = phaseLookup.get(phaseId)
        const rawDuration = typeof phaseData?.duration === 'number'
            ? phaseData.duration
            : duration
        const safeDuration = typeof rawDuration === 'number' && Number.isFinite(rawDuration)
            ? Math.max(rawDuration, 0)
            : 0
        const actualStartDate = phaseData?.actualStartDate
        const scheduledStartDate = phaseData?.scheduledStartDate
        const actualEndDate = phaseData?.actualEndDate
        const scheduledEndDate = phaseData?.scheduledEndDate

        const initialEndDate = (() => {
            const endCandidates = [actualEndDate, scheduledEndDate]
            for (const candidate of endCandidates) {
                if (candidate) {
                    const parsed = moment(candidate)
                    if (parsed.isValid()) {
                        return parsed.toDate()
                    }
                }
            }

            const startSource = actualStartDate ?? scheduledStartDate

            if (startSource) {
                const parsedStart = moment(startSource)
                if (parsedStart.isValid()) {
                    if (safeDuration > 0) {
                        return parsedStart
                            .clone()
                            .add(safeDuration, 'seconds')
                            .toDate()
                    }

                    return parsedStart
                        .clone()
                        .add(1, 'hour')
                        .toDate()
                }
            }

            return undefined
        })()

        setExtendTarget({
            actualEndDate,
            actualStartDate,
            duration: safeDuration,
            id: phaseId,
            name: phaseName,
            scheduledEndDate,
            scheduledStartDate,
        })
        setExtendSelectedEndDate(initialEndDate)
        setExtendError(undefined)
    }, [phaseLookup])

    const closeExtendModal = useCallback(() => {
        setExtendTarget(undefined)
        setExtendSelectedEndDate(undefined)
        setExtendError(undefined)
    }, [])

    const handleExtendEndDateChange = useCallback((date: Date | null) => {
        setExtendSelectedEndDate(date ?? undefined)
        if (extendError) {
            setExtendError(undefined)
        }
    }, [extendError])

    const extendStartMoment = useMemo(() => {
        const startSource = extendTarget?.actualStartDate ?? extendTarget?.scheduledStartDate
        if (!startSource) {
            return undefined
        }

        const parsed = moment(startSource)
        return parsed.isValid() ? parsed : undefined
    }, [extendTarget?.actualStartDate, extendTarget?.scheduledStartDate])

    const extendStartDateDisplay = useMemo(() => {
        if (!extendStartMoment) {
            return '-'
        }

        return extendStartMoment
            .clone()
            .local()
            .format(TABLE_DATE_FORMAT)
    }, [extendStartMoment])

    const extendStartDate = useMemo(() => {
        if (!extendStartMoment) {
            return undefined
        }

        return extendStartMoment.toDate()
    }, [extendStartMoment])

    const handleExtendSubmit = useCallback(async () => {
        if (!extendTarget) {
            return
        }

        const startSource = extendTarget.actualStartDate ?? extendTarget.scheduledStartDate
        if (!startSource) {
            setExtendError('Phase start date is not available. Please refresh and try again.')
            return
        }

        const startMoment = moment(startSource)
        if (!startMoment.isValid()) {
            setExtendError('Phase start date is not valid. Please refresh and try again.')
            return
        }

        if (!extendSelectedEndDate) {
            setExtendError('Select a new end date.')
            return
        }

        const endMoment = moment(extendSelectedEndDate)
        if (!endMoment.isValid()) {
            setExtendError('Select a valid end date.')
            return
        }

        const totalSecondsFloat = endMoment.diff(startMoment, 'seconds', true)

        if (totalSecondsFloat <= 0) {
            setExtendError('End date must be after the start date.')
            return
        }

        const currentEndMoment = (() => {
            const endSource = extendTarget.actualEndDate ?? extendTarget.scheduledEndDate
            if (endSource) {
                const parsed = moment(endSource)
                if (parsed.isValid()) {
                    return parsed
                }
            }

            const currentDuration = extendTarget.duration
            if (typeof currentDuration === 'number' && Number.isFinite(currentDuration)) {
                return startMoment
                    .clone()
                    .add(Math.max(currentDuration, 0), 'seconds')
            }

            return undefined
        })()

        if (currentEndMoment && !endMoment.isAfter(currentEndMoment)) {
            setExtendError('New end date must extend the phase beyond the current end date.')
            return
        }

        setExtendError(undefined)

        const didSucceed = await handlePhaseUpdate(
            extendTarget.id,
            {
                isOpen: true,
                scheduledEndDate: endMoment.toISOString(),
            },
            {
                error: `Failed to extend ${extendTarget.name} phase.`,
                success: `${extendTarget.name} phase extended.`,
                toastId: 'extend',
            },
        )

        if (didSucceed) {
            closeExtendModal()
        }
    }, [
        closeExtendModal,
        extendSelectedEndDate,
        extendTarget,
        handlePhaseUpdate,
    ])

    const openReopenModal = useCallback((
        phaseId: string,
        phaseName: string,
        duration?: number,
    ) => {
        const phaseData = phaseLookup.get(phaseId)
        const baseDuration = typeof phaseData?.duration === 'number'
            ? phaseData.duration
            : duration
        const safeDuration = typeof baseDuration === 'number' && Number.isFinite(baseDuration)
            ? Math.max(baseDuration, 0)
            : 0
        const actualStartDate = phaseData?.actualStartDate
        const actualEndDate = phaseData?.actualEndDate

        const initialEndDate: Date | undefined = (() => {
            if (actualEndDate) {
                const parsedActualEnd = moment(actualEndDate)
                if (parsedActualEnd.isValid()) {
                    return parsedActualEnd.toDate()
                }
            }

            if (actualStartDate) {
                const parsedActualStart = moment(actualStartDate)
                if (parsedActualStart.isValid()) {
                    if (safeDuration > 0) {
                        return parsedActualStart
                            .clone()
                            .add(safeDuration, 'seconds')
                            .toDate()
                    }

                    return parsedActualStart
                        .clone()
                        .add(1, 'hour')
                        .toDate()
                }
            }

            return undefined
        })()

        setReopenTarget({
            actualEndDate,
            actualStartDate,
            duration: safeDuration,
            id: phaseId,
            name: phaseName,
        })
        setReopenSelectedEndDate(initialEndDate)
        setReopenError(undefined)
    }, [phaseLookup])

    const closeReopenModal = useCallback(() => {
        setReopenTarget(undefined)
        setReopenSelectedEndDate(undefined)
        setReopenError(undefined)
    }, [])

    const handleReopenEndDateChange = useCallback((date: Date | null) => {
        setReopenSelectedEndDate(date ?? undefined)
        if (reopenError) {
            setReopenError(undefined)
        }
    }, [reopenError])

    const reopenStartMoment = useMemo(() => {
        if (!reopenTarget?.actualStartDate) {
            return undefined
        }

        const parsed = moment(reopenTarget.actualStartDate)
        return parsed.isValid() ? parsed : undefined
    }, [reopenTarget?.actualStartDate])

    const reopenStartDateDisplay = useMemo(() => {
        if (!reopenStartMoment) {
            return '-'
        }

        return reopenStartMoment
            .clone()
            .local()
            .format(TABLE_DATE_FORMAT)
    }, [reopenStartMoment])

    const reopenStartDate = useMemo(() => {
        if (!reopenStartMoment) {
            return undefined
        }

        return reopenStartMoment.toDate()
    }, [reopenStartMoment])

    const handleReadOnlyInputChange = useCallback((event: FocusEvent<HTMLInputElement>) => {
        event.preventDefault()
        event.stopPropagation()
    }, [])

    const timelineRowsWithActions = useMemo<ChallengeTimelineRow[]>(() => {
        if (phaseOrderingOptions.isTask && !phaseOrderingOptions.isTopgearTask) {
            return []
        }

        if (!canManagePhases) {
            return timelineRows
        }

        return timelineRows.map(row => {
            const phaseId = row.id
            if (!phaseId) {
                return row
            }

            const normalizedStatus = row.status
                .trim()
                .toLowerCase()
            const isLoading = Boolean(phaseActionLoadingMap[phaseId])
            const actions: ChallengeTimelineAction[] = []
            const phaseData = phaseLookup.get(phaseId)

            if (normalizedStatus === 'open') {
                actions.push({
                    disabled: isLoading,
                    label: 'Extend',
                    loading: isLoading,
                    onClick: () => openExtendModal(phaseId, row.name, row.duration),
                })
                actions.push({
                    disabled: isLoading,
                    label: 'Close',
                    loading: isLoading,
                    onClick: () => {
                        handlePhaseUpdate(phaseId, { isOpen: false }, {
                            error: `Failed to close ${row.name} phase.`,
                            success: `${row.name} phase closed.`,
                            toastId: 'close',
                        })
                    },
                })
            } else if (normalizedStatus === 'pending') {
                let canOpenPhase = true

                if (phaseData?.predecessor) {
                    const predecessorPhase = phaseLookup.get(phaseData.predecessor)
                    const predecessorIsClosed = predecessorPhase?.isOpen === false
                    const predecessorHasActualStart = Boolean(predecessorPhase?.actualStartDate)
                    const predecessorHasActualEnd = Boolean(predecessorPhase?.actualEndDate)
                    // Allow opening the phase only when the predecessor has been opened and closed.
                    if (
                        !predecessorIsClosed
                        || !predecessorHasActualStart
                        || !predecessorHasActualEnd
                    ) {
                        canOpenPhase = false
                    }
                }

                if (canOpenPhase) {
                    actions.push({
                        disabled: isLoading,
                        label: 'Open',
                        loading: isLoading,
                        onClick: () => {
                            handlePhaseUpdate(phaseId, { isOpen: true }, {
                                error: `Failed to open ${row.name} phase.`,
                                success: `${row.name} phase opened.`,
                                toastId: 'open',
                            })
                        },
                    })
                }
            } else if (normalizedStatus === 'closed') {
                const canReopenPhase = (() => {
                    if (!reopenEligiblePhaseIds.size) {
                        return false
                    }

                    if (reopenEligiblePhaseIds.has(phaseId)) {
                        return true
                    }

                    if (phaseData?.id && reopenEligiblePhaseIds.has(phaseData.id)) {
                        return true
                    }

                    if (phaseData?.phaseId && reopenEligiblePhaseIds.has(phaseData.phaseId)) {
                        return true
                    }

                    return false
                })()

                if (canReopenPhase) {
                    actions.push({
                        disabled: isLoading,
                        label: 'Reopen',
                        onClick: () => openReopenModal(phaseId, row.name, row.duration),
                    })
                }
            }

            if (!actions.length) {
                return row
            }

            return {
                ...row,
                actions,
            }
        })
    }, [
        canManagePhases,
        handlePhaseUpdate,
        openExtendModal,
        openReopenModal,
        phaseActionLoadingMap,
        phaseLookup,
        reopenEligiblePhaseIds,
        timelineRows,
        phaseOrderingOptions,
    ])

    const shouldShowTimelineSection = useMemo<boolean>(() => {
        const isTask = phaseOrderingOptions.isTask === true
        const isTopgearTask = phaseOrderingOptions.isTopgearTask === true
        return ((!isTask) || isTopgearTask) && timelineRowsWithActions.length > 0
    }, [phaseOrderingOptions, timelineRowsWithActions])

    const isExtendSubmitting = extendTarget
        ? Boolean(phaseActionLoadingMap[extendTarget.id])
        : false

    const isReopenSubmitting = reopenTarget
        ? Boolean(phaseActionLoadingMap[reopenTarget.id])
        : false

    const handleReopenSubmit = useCallback(async () => {
        if (!reopenTarget) {
            return
        }

        if (!reopenTarget.actualStartDate) {
            setReopenError('Phase start date is not available. Please refresh and try again.')
            return
        }

        const startMoment = moment(reopenTarget.actualStartDate)
        if (!startMoment.isValid()) {
            setReopenError('Phase start date is not valid. Please refresh and try again.')
            return
        }

        if (!reopenSelectedEndDate) {
            setReopenError('Select a new end date.')
            return
        }

        const endMoment = moment(reopenSelectedEndDate)
        if (!endMoment.isValid()) {
            setReopenError('Select a valid end date.')
            return
        }

        const totalSecondsFloat = endMoment.diff(startMoment, 'seconds', true)

        if (totalSecondsFloat <= 0) {
            setReopenError('End date must be after the start date.')
            return
        }

        const totalSeconds = Math.ceil(totalSecondsFloat)

        setReopenError(undefined)

        const didSucceed = await handlePhaseUpdate(
            reopenTarget.id,
            {
                duration: totalSeconds,
                isOpen: true,
            },
            {
                error: `Failed to reopen ${reopenTarget.name} phase.`,
                success: `${reopenTarget.name} phase reopened.`,
                toastId: 'reopen',
            },
        )

        if (didSucceed) {
            closeReopenModal()
        }
    }, [
        closeReopenModal,
        handlePhaseUpdate,
        reopenSelectedEndDate,
        reopenTarget,
    ])

    // Determine if the current user is allowed to view this challenge detail
    const isLoadingAnything = isLoadingChallengeInfo || isLoadingChallengeResources
    const isUserResource = (myResources?.length ?? 0) > 0
    const canViewChallenge = isAdmin || isUserResource
    const statusLabel = isPastReviewDetail
        ? formatChallengeStatusLabel(challengeInfo?.status)
        : undefined
    const shouldShowChallengeMetaRow = Boolean(statusLabel) || trackTypePills.length > 0

    useEffect(() => {
        const notification = showBannerNotification({
            id: 'ai-review-scores-warning',
            message: `AI Review Scores are advisory only to provide immediate,
                educational, and actionable feedback to members.
                AI Review Scores do not influence winner selection.`,
        })
        return () => notification && removeNotification(notification.id)
    }, [showBannerNotification])

    return (
        <PageWrapper
            pageTitle={challengeInfo?.name ?? ''}
            className={classNames(styles.container, props.className)}
            titleUrl={`${EnvironmentConfig.REVIEW.CHALLENGE_PAGE_URL}/${challengeId}`}
            breadCrumb={breadCrumb}
        >
            {isLoadingChallengeInfo ? (
                <TableLoading />
            ) : (!isLoadingAnything && hasChallengeInfo && !canViewChallenge) ? (
                <div className={styles.permissionDeniedMessage}>
                    You do not have permission to see this challenge.
                    {' '}
                    If you think this is in error, please email support@topcoder.com
                </div>
            ) : challengeInfo ? (
                <>
                    {shouldShowChallengeMetaRow ? (
                        <div className={styles.statusPillRow}>
                            {statusLabel ? (
                                <span className={classNames(styles.statusPill, statusPillClass)}>
                                    {statusLabel}
                                </span>
                            ) : undefined}
                            {trackTypePills.map(text => (
                                <span key={text} className={styles.metaPill}>
                                    {text}
                                </span>
                            ))}
                        </div>
                    ) : undefined}
                    <div className={styles.summary}>
                        {challengeInfo && (
                            <ChallengePhaseInfo
                                challengeInfo={challengeInfo}
                                reviewProgress={reviewProgress}
                                reviewInProgress={reviewInProgress}
                                variant={isPastReviewDetail ? 'past' : 'active'}
                            />
                        )}
                        <ChallengeLinks />
                    </div>

                    {(!phaseOrderingOptions.isTask || phaseOrderingOptions.isTopgearTask) ? (
                        <div className={styles.blockContent}>
                            <div className={styles.phaseHeader}>
                                <span className={styles.textTitle}>Phases</span>

                                {shouldShowPhaseNotificationToggle ? (
                                    <div className={styles.phaseNotificationToggle}>
                                        <InputCheckbox
                                            name='phase-notifications'
                                            label='Phase Notifications'
                                            checked={phaseNotificationsEnabled}
                                            onChange={noop}
                                            onClick={togglePhaseNotifications}
                                            disabled={isPhaseNotificationToggleDisabled}
                                        />
                                    </div>
                                ) : undefined}
                            </div>

                            <div className={styles.blockTabsContainer}>
                                <Tabs
                                    items={tabItemsWithLoading}
                                    selected={selectedTab}
                                    onChange={switchTab}
                                />
                            </div>

                            <ChallengeDetailsContent
                                selectedTab={selectedTab}
                                isLoadingSubmission={isLoadingSubmission}
                                screening={screening}
                                screeningMinimumPassingScore={screeningMinimumPassingScore}
                                submissions={visibleSubmissions}
                                checkpoint={checkpoint}
                                checkpointScreeningMinimumPassingScore={checkpointScreeningMinimumPassingScore}
                                checkpointReview={checkpointReview}
                                checkpointReviewMinimumPassingScore={checkpointReviewMinimumPassingScore}
                                review={review}
                                reviewMinimumPassingScore={reviewMinimumPassingScore}
                                submitterReviews={submitterReviews}
                                approvalReviews={approvalReviews}
                                approvalMinimumPassingScore={approvalMinimumPassingScore}
                                postMortemReviews={postMortemReviews}
                                postMortemMinimumPassingScore={postMortemMinimumPassingScore}
                                mappingReviewAppeal={mappingReviewAppeal}
                                isActiveChallenge={!isPastReviewDetail}
                                selectedPhaseId={(() => {
                                    const phase = findPhaseByTabLabel(
                                        visibleChallengePhases,
                                        selectedTab,
                                        phaseOrderingOptions,
                                    )
                                    return (phase as { id?: string } | undefined)?.id
                                })()}
                            />
                        </div>
                    ) : undefined}

                    {shouldShowTimelineSection ? (
                        <div className={styles.blockContent}>
                            <span className={styles.textTitle}>Timeline</span>
                            <ChallengeTimeline
                                rows={timelineRowsWithActions}
                                showActions={canManagePhases}
                            />
                        </div>
                    ) : undefined}

                    {shouldShowResourcesSection ? (
                        <div className={styles.blockContent}>
                            <span className={styles.textTitle}>Resources</span>
                            {isLoadingChallengeResources ? (
                                <TableLoading />
                            ) : resources && resources.length > 0 ? (
                                <TableRegistration datas={resources} />
                            ) : (
                                <TableNoRecord message='No resources' />
                            )}
                        </div>
                    ) : undefined}
                </>
            ) : undefined}
            <BaseModal
                open={Boolean(extendTarget)}
                onClose={closeExtendModal}
                showCloseIcon
                classNames={{
                    modal: styles.reopenModal,
                }}
            >
                <div className={styles.reopenModalContent}>
                    <div className={styles.reopenModalTitle}>
                        Extend Phase Duration
                    </div>
                    <div className={styles.phaseDurationInputs}>
                        <InputText
                            name='extend-start-date'
                            label='Start Date'
                            type='text'
                            value={extendStartDateDisplay}
                            forceUpdateValue
                            onChange={handleReadOnlyInputChange}
                            classNameWrapper={styles.reopenModalInput}
                            disabled
                            readonly
                        />
                        <InputDatePicker
                            label='New End Date'
                            date={extendSelectedEndDate}
                            onChange={handleExtendEndDateChange}
                            disabled={isExtendSubmitting}
                            error={extendError}
                            showTimeSelect
                            timeIntervals={15}
                            timeCaption='Time'
                            placeholder='Select end date'
                            minDate={extendStartDate}
                            classNameWrapper={styles.reopenModalInput}
                        />
                    </div>
                    <div className={styles.reopenModalActions}>
                        <Button
                            secondary
                            size='lg'
                            onClick={closeExtendModal}
                            disabled={isExtendSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            primary
                            size='lg'
                            onClick={handleExtendSubmit}
                            disabled={isExtendSubmitting}
                            loading={isExtendSubmitting}
                        >
                            Extend
                        </Button>
                    </div>
                </div>
            </BaseModal>
            <BaseModal
                open={Boolean(reopenTarget)}
                onClose={closeReopenModal}
                showCloseIcon
                classNames={{
                    modal: styles.reopenModal,
                }}
            >
                <div className={styles.reopenModalContent}>
                    <div className={styles.reopenModalTitle}>
                        Set Duration for Reopened Phase
                    </div>
                    <div className={styles.phaseDurationInputs}>
                        <InputText
                            name='reopen-start-date'
                            label='Start Date'
                            type='text'
                            value={reopenStartDateDisplay}
                            forceUpdateValue
                            onChange={handleReadOnlyInputChange}
                            classNameWrapper={styles.reopenModalInput}
                            disabled
                            readonly
                        />
                        <InputDatePicker
                            label='New End Date'
                            date={reopenSelectedEndDate}
                            onChange={handleReopenEndDateChange}
                            disabled={isReopenSubmitting}
                            error={reopenError}
                            showTimeSelect
                            timeIntervals={15}
                            timeCaption='Time'
                            placeholder='Select end date'
                            minDate={reopenStartDate}
                            classNameWrapper={styles.reopenModalInput}
                        />
                    </div>
                    <div className={styles.reopenModalActions}>
                        <Button
                            secondary
                            size='lg'
                            onClick={closeReopenModal}
                            disabled={isReopenSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            primary
                            size='lg'
                            onClick={handleReopenSubmit}
                            disabled={isReopenSubmitting}
                            loading={isReopenSubmitting}
                        >
                            Reopen
                        </Button>
                    </div>
                </div>
            </BaseModal>
        </PageWrapper>
    )
}

export default ChallengeDetailsPage
