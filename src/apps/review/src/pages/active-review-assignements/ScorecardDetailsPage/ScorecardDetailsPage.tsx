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
import { ADMIN, COPILOT } from '../../../config/index.config'
import { useIsEditReview, useIsEditReviewProps } from '../../../lib/hooks/useIsEditReview'
import { activeReviewAssigmentsRouteId, rootRoute } from '../../../config/routes.config'

import styles from './ScorecardDetailsPage.module.scss'

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

    const isEdit = useMemo(
        () => isEditPhase && !isReviewCompleted,
        [isEditPhase, isReviewCompleted],
    )

    const reviewBreadcrumbLabel = useMemo(
        () => submissionInfo?.id
            ?? reviewInfo?.submissionId
            ?? reviewId,
        [reviewId, reviewInfo?.submissionId, submissionInfo?.id],
    )

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
            path: -1,
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

    const hasChallengeCopilotRole = useMemo(
        () => myChallengeResources.some(
            resource => resource.roleName?.toLowerCase() === COPILOT.toLowerCase(),
        ),
        [myChallengeResources],
    )

    const canEditScorecard = useMemo(
        () => Boolean(
            reviewInfo?.committed
            && (hasChallengeAdminRole
                || hasTopcoderAdminRole
                || hasChallengeCopilotRole),
        ),
        [
            hasChallengeAdminRole,
            hasChallengeCopilotRole,
            hasTopcoderAdminRole,
            reviewInfo?.committed,
        ],
    )

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
                        {actionChallengeRole === ADMIN || actionChallengeRole === COPILOT ? (
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
