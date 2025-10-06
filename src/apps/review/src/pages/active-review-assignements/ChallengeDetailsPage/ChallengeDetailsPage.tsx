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
} from '../../../lib/hooks'
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
import { fetchTabs, updatePhaseChangeNotifications } from '../../../lib/services'
import {
    BackendResource,
    ChallengeDetailContextModel,
    ReviewAppContextModel,
    SelectOption,
} from '../../../lib/models'
import { FIRST2FINISH, ITERATIVE_REVIEW, TAB } from '../../../config/index.config'
import {
    activeReviewAssigmentsRouteId,
    pastReviewAssignmentsRouteId,
    rootRoute,
} from '../../../config/routes.config'

import styles from './ChallengeDetailsPage.module.scss'

interface Props {
    className?: string
}

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
        if (!challengeInfo?.type) {
            return
        }

        const iterativePhaseCount = challengeInfo.phases?.filter(
            phase => phase.name === ITERATIVE_REVIEW,
        ).length ?? 0

        const requestedTabLength = challengeInfo.type === FIRST2FINISH
            ? Math.max(iterativePhaseCount, 1)
            : challengeInfo.reviewLength

        fetchTabs(challengeInfo.type, requestedTabLength)
            .then(d => {
                const phases = challengeInfo.phases ?? []
                const hasCheckpointSubmission = phases.some(
                    p => (p.name || '').toLowerCase() === 'checkpoint submission',
                )
                const hasCheckpointReview = phases.some(
                    p => (p.name || '').toLowerCase() === 'checkpoint review',
                )
                const hasApprovalPhase = phases.some(
                    p => (p.name || '').toLowerCase() === 'approval',
                )

                const tabs = [...d]

                // Insert Checkpoint tab between Registration and Submission / Screening if both phases exist
                if (
                    hasCheckpointSubmission
                    && hasCheckpointReview
                    && !tabs.some(t => t.value === 'Checkpoint')
                ) {
                    const regIdx = tabs.findIndex(t => t.value === 'Registration')
                    const insertIdx = regIdx >= 0 ? regIdx + 1 : 0
                    tabs.splice(insertIdx, 0, { label: 'Checkpoint', value: 'Checkpoint' })
                }

                // Ensure Approval tab appears only if approval phases exist; place before Winners
                const approvalIdx = tabs.findIndex(t => t.value === 'Approval')
                if (hasApprovalPhase && approvalIdx < 0) {
                    const reviewIdx = tabs.findIndex(
                        t => t.value === 'Review / Appeals' || t.value === 'Review',
                    )
                    const winnersIdx = tabs.findIndex(t => t.value === 'Winners')
                    const insertIdx = reviewIdx >= 0
                        ? reviewIdx + 1
                        : (winnersIdx >= 0 ? winnersIdx : tabs.length)
                    tabs.splice(insertIdx, 0, { label: 'Approval', value: 'Approval' })
                } else if (!hasApprovalPhase && approvalIdx >= 0) {
                    tabs.splice(approvalIdx, 1)
                }

                setTabItems(tabs)
            })
    }, [
        challengeInfo?.phases,
        challengeInfo?.reviewLength,
        challengeInfo?.type,
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

    return (
        <PageWrapper
            pageTitle={challengeInfo?.name ?? ''}
            className={classNames(styles.container, props.className)}
            titleUrl={`${EnvironmentConfig.REVIEW.CHALLENGE_PAGE_URL}/${challengeId}`}
            breadCrumb={breadCrumb}
        >
            {isLoadingChallengeInfo ? (
                <TableLoading />
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
                            mappingReviewAppeal={mappingReviewAppeal}
                            isActiveChallenge={!isPastReviewDetail}
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
