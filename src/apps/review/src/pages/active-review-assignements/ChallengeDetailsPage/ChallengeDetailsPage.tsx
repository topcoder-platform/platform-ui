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
    ReviewAppContextModel,
    SelectOption,
} from '../../../lib/models'
import { REVIEWER, TAB } from '../../../config/index.config'
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

    // Sort phases by start date; when Registration and Submission start at the same time,
    // put Registration first (to the left).
    let sorted = [...phases].sort((a, b) => {
        const aStart = new Date(
            a.actualStartDate || a.scheduledStartDate || '',
        )
            .getTime()
        const bStart = new Date(
            b.actualStartDate || b.scheduledStartDate || '',
        )
            .getTime()

        if (!Number.isNaN(aStart) && !Number.isNaN(bStart)) {
            if (aStart !== bStart) return aStart - bStart

            // Tie-breaker when both open at the same time
            const aReg = isExactRegistration(a.name)
            const bReg = isExactRegistration(b.name)
            const aSub = isExactSubmission(a.name)
            const bSub = isExactSubmission(b.name)

            // If one is Registration and the other is Submission, Registration comes first
            if (aReg && bSub) return -1
            if (aSub && bReg) return 1
        }

        // Fallback: keep original relative order
        return 0
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

    let sorted = [...phases].sort((a, b) => {
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

        // Compute phases with pending review assignments for current user (reviewer roles)
        const pendingPhaseIds = new Set<string>()
        if (actionChallengeRole === REVIEWER) {
            for (const s of review) {
                const r = s.review
                const status = (r?.status || '').toUpperCase()
                if (r?.id && status !== 'SUBMITTED' && status !== 'COMPLETED' && r.phaseId) {
                    pendingPhaseIds.add(r.phaseId)
                }
            }
        }

        // Flag tab items that correspond to an open phase with a pending review
        const flagged = items.map(it => {
            const phase = findPhaseByTabLabel(
                challengeInfo?.phases ?? [],
                it.value,
                { isF2F },
            )
            const isOpen = Boolean((phase as { isOpen?: boolean } | undefined)?.isOpen)
            const needsAttention = Boolean(
                (phase as { id?: string } | undefined)?.id
                && pendingPhaseIds.has((phase as { id?: string } | undefined)?.id as string)
                && isOpen,
            )
            return needsAttention ? { ...it, warning: true } : it
        })

        setTabItems(flagged)
    }, [challengeInfo, actionChallengeRole, review])

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
