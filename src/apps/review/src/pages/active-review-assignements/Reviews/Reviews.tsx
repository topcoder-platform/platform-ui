/**
 * Reviews Page - combines AiScorecardViewer layout with ScorecardDetailsPage functionality
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
import useSWR from 'swr'

import { TableLoading } from '~/apps/admin/src/lib'

import {
    AiWorkflowRunItemsResponse,
    useAppNavigate,
    useFetchAiWorkflowsRunItems,
    useFetchSubmissionReviews,
    useFetchSubmissionReviewsProps,
    useRole,
    useRoleProps,
} from '../../../lib/hooks'
import {
    ChallengeDetailContext,
    ConfirmModal,
    PageWrapper,
    ScorecardDetails,
} from '../../../lib'
import { BreadCrumbData, ChallengeDetailContextModel } from '../../../lib/models'
import { SubmissionBarInfo } from '../../../lib/components/SubmissionBarInfo'
import { ChallengeLinksForAdmin } from '../../../lib/components/ChallengeLinksForAdmin'
import { ChallengeLinks } from '../../../lib/components/ChallengeLinks'
import { ADMIN, COPILOT, MANAGER } from '../../../config/index.config'
import { activeReviewAssignmentsRouteId, rootRoute } from '../../../config/routes.config'
import { ScorecardViewer } from '../../../lib/components/Scorecard'
import { useIsEditReview, useIsEditReviewProps } from '../../../lib/hooks/useIsEditReview'
import { fetchReviews } from '../../../lib/services'
import { BackendReview } from '../../../lib/models'
import { AiScorecardContextProvider, useAiScorecardContext } from '../../ai-scorecards/AiScorecardContext'
import ReviewsSidebar from './ReviewsSidebar'

import styles from './Reviews.module.scss'

interface Props {
    className?: string
}

export const Reviews: FC<Props> = props => {
    const navigate = useAppNavigate()
    const location = useLocation()
    const aiScorecardCtx = useAiScorecardContext()
    const { runItems: aiWorkflowRunItems }: AiWorkflowRunItemsResponse = useFetchAiWorkflowsRunItems(aiScorecardCtx.workflowId, aiScorecardCtx.workflowRun?.id)

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
        isLoading: isLoadingReviewsData,
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

    const isLoading = isLoadingReviewsData || !scorecardInfo

    useEffect(() => {
        if (submissionInfo?.id) {
            aiScorecardCtx.setSubmissionId(submissionInfo.id)
        }
    }, [submissionInfo]);

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

    const isEdit = useMemo(
        () => (isEditPhase) && !isReviewCompleted,
        [isEditPhase, isReviewCompleted],
    )

    const reviewBreadcrumbLabel = useMemo(
        () => submissionInfo?.id
            ?? reviewInfo?.submissionId
            ?? '',
        [reviewInfo?.submissionId, submissionInfo?.id],
    )
    const containsPastChallenges = location.pathname.indexOf('/past-challenges/')

    const breadCrumb = useMemo<BreadCrumbData[]>(() => [
        {
            index: 1,
            label: 'Active Challenges',
            path: `${rootRoute}/${activeReviewAssignmentsRouteId}/`,
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
    ], [challengeInfo?.name, challengeInfo?.id, reviewBreadcrumbLabel, containsPastChallenges])

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
                    <div className={styles.pageContentWrap}>
                        <ReviewsSidebar className={styles.sidebar} />
                        <div className={styles.contentWrap}>
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

                            {isSubmitterPhaseLocked && (
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
                            )}
                            {!isSubmitterPhaseLocked && (
                                aiScorecardCtx.workflowRun ? (
                                    <ScorecardViewer
                                        scorecard={scorecardInfo as any}
                                        aiFeedback={aiWorkflowRunItems}
                                        score={aiScorecardCtx.workflowRun?.score}
                                    />
                                ) : (
                                    <ScorecardViewer
                                        scorecard={scorecardInfo as any}
                                        reviewInfo={reviewInfo}
                                        mappingAppeals={mappingAppeals}
                                        isEdit={isEdit}
                                        onCancelEdit={onCancelEdit}
                                        setIsChanged={setIsChanged}
                                        isLoading={isLoading}
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
                                )
                            )}
                        </div>
                    </div>

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

export default Reviews

