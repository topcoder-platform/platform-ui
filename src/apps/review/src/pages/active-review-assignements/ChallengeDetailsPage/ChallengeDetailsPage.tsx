/**
 * Challenge Details Page.
 */
import { kebabCase, startCase, toLower, toUpper, trim } from 'lodash'
import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useSWRConfig } from 'swr'
import classNames from 'classnames'

import { TableLoading } from '~/apps/admin/src/lib'
import { handleError } from '~/apps/admin/src/lib/utils'
import { EnvironmentConfig } from '~/config'
import { InputCheckbox } from '~/libs/ui'

import {
    useFetchScreeningReview,
    useFetchScreeningReviewProps,
    useRole, useRoleProps } from '../../../lib/hooks'
import {
    ChallengeDetailContext,
    ChallengeDetailsContent,
    ChallengeLinks,
    ChallengePhaseInfo,
    PageWrapper,
    ReviewAppContext,
    TableNoRecord,
    TableRegistration,
    Tabs,
} from '../../../lib'
import { updatePhaseChangeNotifications } from '../../../lib/services'
import {
    BackendResource,
    ChallengeDetailContextModel,
    ChallengeInfo,
    ReviewAppContextModel,
    SelectOption,
} from '../../../lib/models'
import { REVIEWER, SUBMITTER, TAB } from '../../../config/index.config'
import { isAppealsPhase, isAppealsResponsePhase } from '../../../lib/utils'
import {
    activeReviewAssigmentsRouteId,
    pastReviewAssignmentsRouteId,
    rootRoute,
} from '../../../config/routes.config'

import styles from './ChallengeDetailsPage.module.scss'

interface Props {
    className?: string
}

// Helpers to keep UI hooks simple and under complexity limits

// helpers for label handling

const insertTabIfMissing = (
    tabs: SelectOption[],
    value: string,
    label: string,
    insertIdx: number,
): void => {
    if (!tabs.some(t => t.value === value)) {
        tabs.splice(insertIdx, 0, { label, value })
    }
}

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

// Determine review completion flags for tabs (any assignment and any pending)
const computeReviewCompletion = (
    review: Array<{ review?: { id?: string; status?: string | null; resourceId?: string } }> | undefined,
    reviewerIds: Set<string>,
): { hasAnyReviewAssignment: boolean; hasAnyPendingReview: boolean } => {
    let hasAnyReviewAssignment = false
    let hasAnyPendingReview = false

    if (reviewerIds.size > 0) {
        for (const s of review || []) {
            const r = s.review
            const isMine = Boolean(r?.id)
                && Boolean(r?.resourceId)
                && reviewerIds.has(r?.resourceId as string)
            if (isMine) {
                hasAnyReviewAssignment = true
                const status = (r?.status || '').toUpperCase()
                if (status !== 'COMPLETED') {
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

// Build tabs directly from the challenge phases (one tab per phase)
const buildPhaseTabs = (
    phases: Array<{ id?: string; name?: string; scheduledStartDate?: string; actualStartDate?: string }>,
    status?: string,
    opts?: { isF2F?: boolean },
): SelectOption[] => {
    // Helper: normalize name for comparisons
    const norm = (s?: string): string => (s || '')
        .trim()
        .toLowerCase()

    const isExactRegistration = (name?: string): boolean => norm(name) === 'registration'
    const isExactSubmission = (name?: string): boolean => norm(name) === 'submission'
    const isIterativeReview = (name?: string): boolean => {
        const n = norm(name)
        return n.includes('iterative review')
    }

    // Common date-based comparator used as a fallback
    const dateComparator = (a: typeof phases[number], b: typeof phases[number]): number => {
        const aStart = new Date(a.actualStartDate || a.scheduledStartDate || '')
            .getTime()
        const bStart = new Date(b.actualStartDate || b.scheduledStartDate || '')
            .getTime()
        if (!Number.isNaN(aStart) && !Number.isNaN(bStart)) {
            if (aStart !== bStart) return aStart - bStart
            // Tie-breaker when both open at the same time: Registration before Submission
            const aReg = isExactRegistration(a.name)
            const bReg = isExactRegistration(b.name)
            const aSub = isExactSubmission(a.name)
            const bSub = isExactSubmission(b.name)
            if (aReg && bSub) return -1
            if (aSub && bReg) return 1
        }

        return 0
    }

    // When checkpoint phases exist, enforce a specific visual order for tabs
    const explicitOrderList = [
        'registration',
        'checkpoint submission',
        'checkpoint screening',
        'checkpoint review',
        'submission',
        'screening',
        'review',
        'approval',
    ]
    const explicitOrder = new Map<string, number>(
        explicitOrderList.map((n, i) => [n, i]),
    )
    const hasCheckpointPhases = phases.some(p => {
        const n = norm(p.name)
        return n === 'checkpoint submission' || n === 'checkpoint screening' || n === 'checkpoint review'
    })

    let sorted = [...phases].sort((a, b) => {
        const aName = norm(a.name)
        const bName = norm(b.name)

        if (hasCheckpointPhases) {
            const aRank = explicitOrder.has(aName) ? (explicitOrder.get(aName) as number) : Number.POSITIVE_INFINITY
            const bRank = explicitOrder.has(bName) ? (explicitOrder.get(bName) as number) : Number.POSITIVE_INFINITY

            if (aRank !== bRank) return aRank - bRank
            // If both are outside the explicit list, or same rank, fall back to date ordering
            return dateComparator(a, b)
        }

        // Default behavior (no checkpoint phases): date ordering with tie-breakers
        return dateComparator(a, b)
    })

    // For First2Finish: show any Iterative Review phases AFTER Registration and Submission.
    if (opts?.isF2F) {
        const iterative = sorted.filter(p => isIterativeReview(p.name))
        if (iterative.length) {
            const remaining = sorted.filter(p => !isIterativeReview(p.name))
            const regIdx = remaining.findIndex(p => isExactRegistration(p.name))
            const subIdx = remaining.findIndex(p => isExactSubmission(p.name))
            const afterIdx = Math.max(regIdx, subIdx)
            if (afterIdx >= 0 && afterIdx < remaining.length) {
                sorted = [
                    ...remaining.slice(0, afterIdx + 1),
                    ...iterative,
                    ...remaining.slice(afterIdx + 1),
                ]
            } else {
                // If Registration/Submission not found for any reason, keep original order
                sorted = [...remaining, ...iterative]
            }
        }
    }

    // Add numbering for duplicate phase names (e.g., Iterative Review 2, 3, ...)
    const counts = new Map<string, number>()
    const nextLabel = (name: string): string => {
        const n = counts.get(name) || 0
        counts.set(name, n + 1)
        if (n === 0) return name
        return `${name} ${n + 1}`
    }

    const items: SelectOption[] = []
    sorted.forEach(p => {
        const raw = p?.name?.trim() || ''
        if (!raw) return
        const label = nextLabel(raw)
        items.push({ label, value: label })
    })

    // Preserve Winners tab at the end for completed/cancelled challenges
    const normalizedStatus = (status || '').toUpperCase()
    const isEnded = normalizedStatus === 'COMPLETED' || normalizedStatus.startsWith('CANCELLED')
    if (isEnded) {
        insertTabIfMissing(items, 'Winners', 'Winners', items.length)
    }

    return items
}

// Map the tab label to its corresponding phase (same ordering/labeling as buildPhaseTabs)
const findPhaseByTabLabel = (
    phases: Array<{
        id?: string
        name?: string
        scheduledStartDate?: string
        actualStartDate?: string
        scheduledEndDate?: string
        actualEndDate?: string
    }>,
    label: string,
    opts?: { isF2F?: boolean },
): typeof phases[number] | undefined => {
    const norm = (s?: string): string => (s || '').trim()
        .toLowerCase()
    const isExactRegistration = (name?: string): boolean => norm(name) === 'registration'
    const isExactSubmission = (name?: string): boolean => norm(name) === 'submission'
    const isIterativeReview = (name?: string): boolean => norm(name)
        .includes('iterative review')

    // Shared date-based comparator fallback
    const dateComparator = (a: typeof phases[number], b: typeof phases[number]): number => {
        const aStart = new Date(a.actualStartDate || a.scheduledStartDate || '')
            .getTime()
        const bStart = new Date(b.actualStartDate || b.scheduledStartDate || '')
            .getTime()
        if (!Number.isNaN(aStart) && !Number.isNaN(bStart)) {
            if (aStart !== bStart) return aStart - bStart
            const aReg = isExactRegistration(a.name)
            const bReg = isExactRegistration(b.name)
            const aSub = isExactSubmission(a.name)
            const bSub = isExactSubmission(b.name)
            if (aReg && bSub) return -1
            if (aSub && bReg) return 1
        }

        return 0
    }

    // Keep ordering logic aligned with buildPhaseTabs when checkpoint phases exist
    const explicitOrderList = [
        'registration',
        'checkpoint submission',
        'checkpoint screening',
        'checkpoint review',
        'submission',
        'screening',
        'review',
        'approval',
    ]
    const explicitOrder = new Map<string, number>(explicitOrderList.map((n, i) => [n, i]))
    const hasCheckpointPhases = phases.some(p => {
        const n = norm(p.name)
        return n === 'checkpoint submission' || n === 'checkpoint screening' || n === 'checkpoint review'
    })

    let sorted = [...phases].sort((a, b) => {
        const aName = norm(a.name)
        const bName = norm(b.name)
        if (hasCheckpointPhases) {
            const aRank = explicitOrder.has(aName) ? (explicitOrder.get(aName) as number) : Number.POSITIVE_INFINITY
            const bRank = explicitOrder.has(bName) ? (explicitOrder.get(bName) as number) : Number.POSITIVE_INFINITY
            if (aRank !== bRank) return aRank - bRank

            return dateComparator(a, b)
        }

        return dateComparator(a, b)
    })

    if (opts?.isF2F) {
        const iterative = sorted.filter(p => isIterativeReview(p.name))
        if (iterative.length) {
            const remaining = sorted.filter(p => !isIterativeReview(p.name))
            const regIdx = remaining.findIndex(p => isExactRegistration(p.name))
            const subIdx = remaining.findIndex(p => isExactSubmission(p.name))
            const afterIdx = Math.max(regIdx, subIdx)
            if (afterIdx >= 0 && afterIdx < remaining.length) {
                sorted = [
                    ...remaining.slice(0, afterIdx + 1),
                    ...iterative,
                    ...remaining.slice(afterIdx + 1),
                ]
            } else {
                sorted = [...remaining, ...iterative]
            }
        }
    }

    const counts = new Map<string, number>()
    const labelFor = (rawName: string): string => {
        const n = counts.get(rawName) || 0
        counts.set(rawName, n + 1)
        if (n === 0) return rawName
        return `${rawName} ${n + 1}`
    }

    for (const p of sorted) {
        const raw = p?.name?.trim() || ''
        if (raw) {
            const computedLabel = labelFor(raw)
            if (computedLabel === label) return p
        }
    }

    return undefined
}

// (Phase dates display removed)

// eslint-disable-next-line complexity
export const ChallengeDetailsPage: FC<Props> = (props: Props) => {
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
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
    const { actionChallengeRole }: useRoleProps = useRole()
    const hasChallengeInfo = Boolean(challengeInfo)
    const challengeStatus = challengeInfo?.status?.toUpperCase()

    // get challenge screening, review data
    const {
        isLoading: isLoadingSubmission,
        review,
        reviewProgress,
        screening,
        checkpoint,
        checkpointReview,
        approvalReviews,
        postMortemReviews,
        mappingReviewAppeal,
        submitterReviews,
    }: useFetchScreeningReviewProps = useFetchScreeningReview()

    const [tabItems, setTabItems] = useState<SelectOption[]>([])
    const [selectedTab, setSelectedTab] = useState<string>('')
    const isPastReviewDetail = useMemo(
        () => location.pathname.includes(`/${pastReviewAssignmentsRouteId}/`),
        [location.pathname],
    )
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
    const [phaseNotificationsEnabled, setPhaseNotificationsEnabled] = useState<boolean>(
        currentUserResource?.phaseChangeNotifications ?? false,
    )
    const [isSavingPhaseNotifications, setIsSavingPhaseNotifications] = useState(false)

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
        : activeReviewAssigmentsRouteId
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
        const activePrefix = `/${activeReviewAssigmentsRouteId}/`
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

    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tabItems.length) {
            if (tab) {
                const tabId = tabItems.findIndex(item => kebabCase(item.value) === tab)
                if (tabId > -1) {
                    setSelectedTab(tabItems[tabId].value)
                    sessionStorage.setItem(TAB, tabItems[tabId].value)
                }
            } else {
                setSelectedTab(tabItems[0].value)
                sessionStorage.setItem(TAB, tabItems[0].value)
            }
        }
    }, [searchParams, tabItems])

    // eslint-disable-next-line complexity
    useEffect(() => {
        if (!challengeInfo) return
        const typeName = challengeInfo?.type?.name?.toLowerCase?.() || ''
        const typeAbbrev = challengeInfo?.type?.abbreviation?.toLowerCase?.() || ''
        const isF2F = typeAbbrev === 'f2f' || typeName.replace(/\s|-/g, '') === 'first2finish'
        const items = buildPhaseTabs(
            challengeInfo.phases ?? [],
            challengeInfo.status,
            { isF2F },
        )

        // Only add indicators on active-challenges view
        if (isPastReviewDetail) {
            setTabItems(items)
            return
        }

        // Determine phase ids by type for quick lookup
        const phasesByName = new Map<string, string[]>();
        (challengeInfo?.phases ?? []).forEach((p: { id?: string; name?: string }) => {
            const n = (p.name || '').trim()
                .toLowerCase()
            const ids = phasesByName.get(n) || []
            if (p.id) ids.push(p.id)
            phasesByName.set(n, ids)
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
        const pendingReview = (() => {
            if (myReviewerResourceIds.size === 0) return false
            // Treat not-started (no id) or non-COMPLETED as pending
            return (review || []).some(s => {
                const r = s.review
                if (!r) return false
                if (!r.resourceId || !myReviewerResourceIds.has(r.resourceId)) return false
                const status = (r.status || '').toUpperCase()
                return status !== 'COMPLETED'
            })
        })()

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
                    finalItems = finalItems.map(it => (it.value.trim()
                        .toLowerCase() === 'appeals'
                        ? { ...it, warning: true }
                        : it))
                }
            }
        }

        setTabItems(finalItems)
    }, [challengeInfo, actionChallengeRole, review, submitterReviews, myResources, mappingReviewAppeal])

    // Add completion indicators for active challenges on relevant tabs
    // eslint-disable-next-line complexity
    useEffect(() => {
        if (!challengeInfo || !tabItems.length || isPastReviewDetail) return

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
    const isAdmin = useMemo(
        () => loginUserInfo?.roles?.some(
            role => typeof role === 'string' && role.toLowerCase() === 'administrator',
        ) ?? false,
        [loginUserInfo?.roles],
    )
    const shouldShowResourcesSection = hasCopilotRole || isAdmin

    // Determine if the current user is allowed to view this challenge detail
    const isLoadingAnything = isLoadingChallengeInfo || isLoadingChallengeResources
    const isUserResource = (myResources?.length ?? 0) > 0
    const canViewChallenge = isAdmin || isUserResource

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
                    {isPastReviewDetail && (
                        (() => {
                            const label = formatChallengeStatusLabel(challengeInfo.status)
                            return label ? (
                                <div className={styles.statusPillRow}>
                                    <span className={classNames(styles.statusPill, statusPillClass)}>
                                        {label}
                                    </span>
                                </div>
                            ) : undefined
                        })()
                    )}
                    <div className={styles.summary}>
                        {challengeInfo && (
                            <ChallengePhaseInfo
                                challengeInfo={challengeInfo}
                                reviewProgress={reviewProgress}
                                variant={isPastReviewDetail ? 'past' : 'active'}
                            />
                        )}
                        <ChallengeLinks />
                    </div>

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
                                items={tabItems}
                                selected={selectedTab}
                                onChange={switchTab}
                            />
                        </div>

                        <ChallengeDetailsContent
                            selectedTab={selectedTab}
                            isLoadingSubmission={isLoadingSubmission}
                            screening={screening}
                            checkpoint={checkpoint}
                            checkpointReview={checkpointReview}
                            review={review}
                            submitterReviews={submitterReviews}
                            approvalReviews={approvalReviews}
                            postMortemReviews={postMortemReviews}
                            mappingReviewAppeal={mappingReviewAppeal}
                            isActiveChallenge={!isPastReviewDetail}
                            selectedPhaseId={(() => {
                                const phase = findPhaseByTabLabel(
                                    challengeInfo?.phases ?? [],
                                    selectedTab,
                                    (() => {
                                        const typeName = challengeInfo?.type?.name?.toLowerCase?.() || ''
                                        const typeAbbrev = challengeInfo?.type?.abbreviation?.toLowerCase?.() || ''
                                        const simplifiedType = typeName.replace(/\s|-/g, '')
                                        const isF2F = typeAbbrev === 'f2f'
                                            || simplifiedType === 'first2finish'
                                        return { isF2F }
                                    })(),
                                )
                                return (phase as { id?: string } | undefined)?.id
                            })()}
                        />
                    </div>

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
        </PageWrapper>
    )
}

export default ChallengeDetailsPage
