/**
 * Scorecard Details Page.
 */
import {
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useLocation, useParams } from 'react-router-dom'
import classNames from 'classnames'

import { TableLoading } from '~/apps/admin/src/lib'

import {
    useAppNavigate,
    useFetchSubmissionReviews,
    useFetchSubmissionReviewsProps,
    useRole,
    useRoleProps,
} from '../../../lib/hooks'
import {
    ChallengeDetailContext,
    ChallengeLinks,
    ConfirmModal,
    PageWrapper,
    ScorecardDetails,
} from '../../../lib'
import { BreadCrumbData, ChallengeDetailContextModel } from '../../../lib/models'
import { SubmissionBarInfo } from '../../../lib/components/SubmissionBarInfo'
import { ChallengeLinksForAdmin } from '../../../lib/components/ChallengeLinksForAdmin'
import { ADMIN, COPILOT, MANAGER } from '../../../config/index.config'
import { useIsEditReview, useIsEditReviewProps } from '../../../lib/hooks/useIsEditReview'
import { activeReviewAssigmentsRouteId, rootRoute } from '../../../config/routes.config'

import styles from './ScorecardDetailsPage.module.scss'

type ReviewPhaseType = 'screening' | 'checkpoint screening' | 'checkpoint review' | 'approval'

const detectReviewPhaseType = (value?: unknown): ReviewPhaseType | undefined => {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalized = `${value}`
        .trim()
        .toLowerCase()

    if (!normalized) {
        return undefined
    }

    if (normalized.includes('checkpoint screening')) {
        return 'checkpoint screening'
    }

    if (normalized.includes('checkpoint review')) {
        return 'checkpoint review'
    }

    if (normalized.includes('screening')) {
        return 'screening'
    }

    if (normalized.includes('approval')) {
        return 'approval'
    }

    return undefined
}

type ReviewerConfig = {
    phaseId?: unknown
    scorecardId?: unknown
    type?: unknown
}

type ChallengePhaseSummary = {
    id?: unknown
    name?: unknown
}

const detectReviewTypeFromReviewerConfig = (
    reviewerConfigs: ReviewerConfig[] | undefined,
    normalizedPhaseId?: string,
    normalizedScorecardId?: string,
): ReviewPhaseType | undefined => {
    if (!reviewerConfigs?.length) {
        return undefined
    }

    const matchedConfig = reviewerConfigs.find(config => (
        (normalizedPhaseId && `${config.phaseId}` === normalizedPhaseId)
        || (normalizedScorecardId && `${config.scorecardId}` === normalizedScorecardId)
    ))

    return detectReviewPhaseType(matchedConfig?.type)
}

const detectReviewTypeFromMetadata = (
    metadata: unknown,
): ReviewPhaseType | undefined => {
    if (!metadata || typeof metadata !== 'object') {
        return undefined
    }

    const metadataRecord = metadata as Record<string, unknown>
    const metadataKeys = ['type', 'reviewType', 'scorecardType', 'phaseName', 'name']

    for (const key of metadataKeys) {
        const rawValue = metadataRecord[key]
        if (typeof rawValue === 'string') {
            const detected = detectReviewPhaseType(rawValue)
            if (detected) {
                return detected
            }
        }
    }

    return undefined
}

const detectReviewTypeFromPhases = (
    phases: ChallengePhaseSummary[] | undefined,
    targetPhaseId?: unknown,
): ReviewPhaseType | undefined => {
    if (!phases?.length || targetPhaseId === undefined || targetPhaseId === null) {
        return undefined
    }

    const normalizedTargetPhaseId = `${targetPhaseId}`
    const matchedPhase = phases.find(phase => `${phase.id}` === normalizedTargetPhaseId)

    return detectReviewPhaseType(matchedPhase?.name)
}

const canRoleEditPhase = (
    reviewPhaseType: ReviewPhaseType | undefined,
    currentPhaseReviewType: ReviewPhaseType | undefined,
    normalizedRoleName: string,
): boolean => {
    switch (reviewPhaseType) {
        case 'checkpoint screening':
            return currentPhaseReviewType === 'checkpoint screening'
                && normalizedRoleName === 'checkpoint screener'
        case 'checkpoint review':
            return currentPhaseReviewType === 'checkpoint review'
                && normalizedRoleName === 'checkpoint reviewer'
        case 'screening': {
            const isScreenerRole = (
                normalizedRoleName.includes('screener')
                || normalizedRoleName.includes('screening')
            ) && !normalizedRoleName.includes('checkpoint')

            return currentPhaseReviewType === 'screening'
                && isScreenerRole
        }

        case 'approval': {
            const isApproverRole = normalizedRoleName.includes('approver')
                || normalizedRoleName.includes('approval')

            return currentPhaseReviewType === 'approval'
                && isApproverRole
        }

        default:
            return false
    }
}

interface Props {
    className?: string
}

export const ScorecardDetailsPage: FC<Props> = (props: Props) => {
    const navigate = useAppNavigate()
    const location = useLocation()
    const { reviewId = '' }: { reviewId?: string } = useParams<{ reviewId: string }>()
    const {
        actionChallengeRole,
        myChallengeResources,
        myChallengeRoles,
    }: useRoleProps = useRole()
    const [showCloseConfirmation, setShowCloseConfirmation] = useState<boolean>(false)
    const [isChanged, setIsChanged] = useState(false)
    const [isManagerEdit, setIsManagerEdit] = useState(false)

    const {
        challengeInfo,
        isLoadingChallengeInfo,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { isEdit: isEditPhase }: useIsEditReviewProps = useIsEditReview()

    const {
        addAppeal,
        addAppealResponse,
        addManagerComment,
        doDeleteAppeal,
        mappingAppeals,
        isLoading,
        isSavingReview,
        isSavingAppeal,
        isSavingAppealResponse,
        isSavingManagerComment,
        isSubmitterPhaseLocked,
        submitterLockedPhaseName,
        reviewInfo,
        scorecardInfo,
        submissionInfo,
        saveReviewInfo,
    }: useFetchSubmissionReviewsProps = useFetchSubmissionReviews()

    const isReviewCompleted = useMemo(
        () => {
            const statusUpper = (reviewInfo?.status || '')
                .toString()
                .toUpperCase()

            if (statusUpper === 'COMPLETED') {
                return true
            }

            return Boolean(reviewInfo?.committed)
        },
        [reviewInfo?.committed, reviewInfo?.status],
    )

    const submitterLockedPhaseDisplay = useMemo(
        () => {
            if (!submitterLockedPhaseName) {
                return 'This review phase'
            }

            const trimmed = submitterLockedPhaseName.trim()
            if (!trimmed) {
                return 'This review phase'
            }

            return trimmed.toLowerCase()
                .endsWith('phase')
                ? trimmed
                : `${trimmed} phase`
        },
        [submitterLockedPhaseName],
    )

    const reviewPhaseType = useMemo<ReviewPhaseType | undefined>(() => {
        const reviewerConfigs = challengeInfo?.reviewers ?? []
        const normalizedPhaseId = reviewInfo?.phaseId ? `${reviewInfo.phaseId}` : undefined
        const normalizedScorecardId = reviewInfo?.scorecardId ? `${reviewInfo.scorecardId}` : undefined

        return detectReviewTypeFromReviewerConfig(
            reviewerConfigs as ReviewerConfig[],
            normalizedPhaseId,
            normalizedScorecardId,
        )
            || detectReviewTypeFromMetadata(reviewInfo?.metadata)
            || detectReviewTypeFromPhases(
                challengeInfo?.phases as ChallengePhaseSummary[],
                reviewInfo?.phaseId,
            )
            || detectReviewPhaseType(scorecardInfo?.name)
            || undefined
    }, [
        challengeInfo?.phases,
        challengeInfo?.reviewers,
        reviewInfo?.metadata,
        reviewInfo?.phaseId,
        reviewInfo?.scorecardId,
        scorecardInfo?.name,
    ])

    const currentPhaseReviewType = useMemo(
        () => detectReviewPhaseType(challengeInfo?.currentPhase),
        [challengeInfo?.currentPhase],
    )

    const isPhaseEditAllowed = useMemo(() => {
        if (!reviewPhaseType || !reviewInfo?.resourceId) {
            return false
        }

        const myResource = myChallengeResources.find(resource => resource.id === reviewInfo.resourceId)
        if (!myResource) {
            return false
        }

        const normalizedRoleName = typeof myResource.roleName === 'string'
            ? myResource.roleName.trim()
                .toLowerCase()
            : ''

        return canRoleEditPhase(
            reviewPhaseType,
            currentPhaseReviewType,
            normalizedRoleName,
        )
    }, [
        reviewPhaseType,
        currentPhaseReviewType,
        myChallengeResources,
        reviewInfo?.resourceId,
    ])

    const isEdit = useMemo(
        () => (isEditPhase || isPhaseEditAllowed) && !isReviewCompleted,
        [isPhaseEditAllowed, isEditPhase, isReviewCompleted],
    )

    const reviewBreadcrumbLabel = useMemo(
        () => submissionInfo?.id
            ?? reviewInfo?.submissionId
            ?? reviewId,
        [reviewId, reviewInfo?.submissionId, submissionInfo?.id],
    )
    const containsPastChallenges = location.pathname.indexOf('/past-challenges/')

    const breadCrumb = useMemo<BreadCrumbData[]>(() => [
        {
            index: 1,
            label: 'Active Challenges',
            path: `${rootRoute}/${activeReviewAssigmentsRouteId}/`,
        },
        {
            fallback: './../../../../challenge-details',
            index: 2,
            label: challengeInfo?.name,
            path: containsPastChallenges > -1
                ? `${rootRoute}/past-challenges/${challengeInfo?.id}/challenge-details`
                : `${rootRoute}/active-challenges/${challengeInfo?.id}/challenge-details`,
        },
        {
            index: 3,
            label: `Review Scorecard - ${reviewBreadcrumbLabel}`,
        },
    ], [challengeInfo?.name, reviewBreadcrumbLabel])

    /**
     * Cancel edit
     */
    const onCancelEdit = useCallback(() => {
        if (isChanged && isEdit) {
            setShowCloseConfirmation(true)
        } else {
            navigate(-1, {
                fallback: './../../../../challenge-details',
            })
        }
    }, [isChanged, isEdit, navigate])

    const hasChallengeAdminRole = useMemo(
        () => myChallengeResources.some(
            resource => resource.roleName?.toLowerCase() === ADMIN.toLowerCase(),
        ),
        [myChallengeResources],
    )

    const hasTopcoderAdminRole = useMemo(
        () => myChallengeRoles.some(
            role => role?.toLowerCase()
                .includes('admin'),
        ),
        [myChallengeRoles],
    )

    const hasChallengeManagerRole = useMemo(
        () => myChallengeResources.some(
            resource => resource.roleName?.toLowerCase() === MANAGER.toLowerCase(),
        ),
        [myChallengeResources],
    )

    const hasChallengeCopilotRole = useMemo(
        () => myChallengeResources.some(
            resource => resource.roleName?.toLowerCase() === COPILOT.toLowerCase(),
        ),
        [myChallengeResources],
    )

    const canEditScorecard = useMemo(() => {
        const challengeStatus = (challengeInfo?.status ?? '')
            .toString()
            .trim()
            .toUpperCase()
        const isChallengeClosed = challengeStatus.includes('COMPLETED')
            || challengeStatus.startsWith('CANCELLED')

        if (isChallengeClosed) {
            return false
        }

        return Boolean(
            reviewInfo?.committed
            && (hasChallengeAdminRole
                || hasTopcoderAdminRole
                || hasChallengeManagerRole
                || hasChallengeCopilotRole),
        )
    }, [
        challengeInfo?.status,
        hasChallengeAdminRole,
        hasChallengeCopilotRole,
        hasChallengeManagerRole,
        hasTopcoderAdminRole,
        reviewInfo?.committed,
    ])

    // Redirect: if user is on a past-challenges route but the challenge is ACTIVE,
    // send them to the corresponding active-challenges route, preserving the rest of the path and query.
    useEffect(() => {
        const status = challengeInfo?.status?.toUpperCase()
        const isActiveChallenge = status === 'ACTIVE'
        if (!isActiveChallenge) return

        const pastPrefix = '/past-challenges/'
        const idx = location.pathname.indexOf(pastPrefix)
        if (idx < 0) return

        const before = location.pathname.slice(0, idx)
        const after = location.pathname.slice(idx + pastPrefix.length)
        const targetPath = `${before}/active-challenges/${after}`
        navigate(`${targetPath}${location.search || ''}`, { replace: true })
    }, [challengeInfo?.status, location.pathname, location.search, navigate])

    useEffect(() => {
        if (!canEditScorecard && isManagerEdit) {
            setIsManagerEdit(false)
        }
    }, [canEditScorecard, isManagerEdit])

    const toggleManagerEdit = useCallback(() => {
        setIsManagerEdit(prev => !prev)
    }, [])

    return (
        <PageWrapper
            pageTitle={challengeInfo?.name ?? ''}
            className={classNames(styles.container, props.className)}
            titleUrl='emptyLink'
            breadCrumb={breadCrumb}
        >
            {isLoadingChallengeInfo ? (
                <TableLoading />
            ) : (
                <>
                    <div className={styles.summary}>
                        <SubmissionBarInfo submission={submissionInfo} />
                        {actionChallengeRole === ADMIN
                         || actionChallengeRole === COPILOT
                         || actionChallengeRole === MANAGER
                            ? (
                                <ChallengeLinksForAdmin
                                    isSavingReview={isSavingReview}
                                    saveReviewInfo={saveReviewInfo}
                                    reviewInfo={reviewInfo}
                                    canEditScorecard={canEditScorecard}
                                    isManagerEdit={isManagerEdit}
                                    onToggleManagerEdit={toggleManagerEdit}
                                />
                            ) : (
                                <ChallengeLinks />
                            )}
                    </div>

                    {isSubmitterPhaseLocked ? (
                        <div className={styles.lockedNotice}>
                            <strong>
                                {submitterLockedPhaseDisplay}
                                {' '}
                                is still in progress.
                            </strong>
                            <span>
                                Feedback becomes available once the phase closes. Please check back later.
                            </span>
                        </div>
                    ) : (
                        <ScorecardDetails
                            mappingAppeals={mappingAppeals}
                            isEdit={isEdit}
                            onCancelEdit={onCancelEdit}
                            setIsChanged={setIsChanged}
                            scorecardInfo={scorecardInfo}
                            isLoading={isLoading}
                            reviewInfo={reviewInfo}
                            isManagerEdit={isManagerEdit}
                            isSavingReview={isSavingReview}
                            isSavingAppeal={isSavingAppeal}
                            isSavingAppealResponse={isSavingAppealResponse}
                            isSavingManagerComment={isSavingManagerComment}
                            saveReviewInfo={saveReviewInfo}
                            addAppeal={addAppeal}
                            addAppealResponse={addAppealResponse}
                            doDeleteAppeal={doDeleteAppeal}
                            addManagerComment={addManagerComment}
                        />
                    )}

                    {isEdit && (
                        <ConfirmModal
                            title='Discard Confirmation'
                            action='discard'
                            onClose={function onClose() {
                                setShowCloseConfirmation(false)
                            }}
                            onConfirm={function onConfirm() {
                                navigate(-1, {
                                    fallback: './../../../../challenge-details',
                                })
                            }}
                            open={showCloseConfirmation}
                            maxWidth='578px'
                        >
                            <div>Are you sure you want to discard the changes?</div>
                        </ConfirmModal>
                    )}
                </>
            )}
        </PageWrapper>
    )
}

export default ScorecardDetailsPage
