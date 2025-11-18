import { mutate } from 'swr'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'

import { ChallengeLinksForAdmin } from '~/apps/review/src/lib/components/ChallengeLinksForAdmin'
import { ScorecardViewer } from '~/apps/review/src/lib/components/Scorecard'
import {
    useAppNavigate,
    useFetchSubmissionReviews,
    useFetchSubmissionReviewsProps,
    useRole,
    useRoleProps,
} from '~/apps/review/src/lib/hooks'
import { ChallengeDetailContextModel, ReviewsContextModel } from '~/apps/review/src/lib/models'
import { ChallengeLinks, ConfirmModal, useChallengeDetailsContext } from '~/apps/review/src/lib'
import { useIsEditReview, useIsEditReviewProps } from '~/apps/review/src/lib/hooks/useIsEditReview'
import { rootRoute } from '~/apps/review/src/config/routes.config'

import { ADMIN, COPILOT, MANAGER } from '../../../../config/index.config'
import { useReviewsContext } from '../../ReviewsContext'

import { ReviewScorecardHeader } from './ReviewScorecardHeader'
import styles from './ReviewViewer.module.scss'

const ReviewViewer: FC = () => {
    const navigate = useAppNavigate()
    const { reviewId, setReviewStatus, setActionButtons, workflow, reviewStatus }: ReviewsContextModel = useReviewsContext()

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
    }: ChallengeDetailContextModel = useChallengeDetailsContext()
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
        saveReviewInfo,
    }: useFetchSubmissionReviewsProps = useFetchSubmissionReviews(reviewId)

    const isLoading = isLoadingReviewsData || !scorecardInfo

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
        () => isEditPhase && !isReviewCompleted,
        [isEditPhase, isReviewCompleted],
    )

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

    const back = useCallback(async (e?: React.MouseEvent<HTMLAnchorElement>) => {
        e?.preventDefault()
        try {
            if (challengeInfo?.id) {
                // Ensure the challenge details reflect the latest data (e.g., active phase)
                await mutate(`challengeBaseUrl/challenges/${challengeInfo?.id}`)
            }
        } catch {
            // no-op: navigation should still occur even if revalidation fails
        }

        const pastPrefix = '/past-challenges/'
        // eslint-disable-next-line no-restricted-globals
        const idx = location.pathname.indexOf(pastPrefix)
        const url = idx > -1
            ? `${rootRoute}/past-challenges/${challengeInfo?.id}/challenge-details`
            : `${rootRoute}/active-challenges/${challengeInfo?.id}/challenge-details`
        navigate(url, {
            fallback: './../../../../challenge-details',
        })
    }, [challengeInfo?.id, mutate, navigate])

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
        <div className={styles.wrap}>
            <div className={styles.contentWrap}>
                <div className={styles.summary}>
                    {/* <SubmissionBarInfo submission={submissionInfo} /> */}
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
                    <>
                        <ReviewScorecardHeader
                            reviewInfo={reviewInfo}
                            scorecardInfo={scorecardInfo}
                            workflow={workflow}
                            reviewProgress={reviewStatus?.progress ?? reviewInfo?.reviewProgress ?? 0}
                        />
                        <ScorecardViewer
                        actionChallengeRole={actionChallengeRole}
                        scorecard={scorecardInfo as any}
                        reviewInfo={reviewInfo}
                        mappingAppeals={mappingAppeals}
                        isEdit={isEdit}
                        onCancelEdit={onCancelEdit}
                        navigateBack={back}
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
                        setReviewStatus={setReviewStatus}
                        setActionButtons={setActionButtons}
                    />
                    </>
                )}
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
        </div>
    )
}

export default ReviewViewer
