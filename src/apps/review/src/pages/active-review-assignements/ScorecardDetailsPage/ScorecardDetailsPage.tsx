/**
 * Scorecard Details Page.
 */
import { FC, useCallback, useContext, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
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
    const params = useParams()
    const { actionChallengeRole }: useRoleProps = useRole()
    const [showCloseConfirmation, setShowCloseConfirmation] = useState<boolean>(false)
    const [isChanged, setIsChanged] = useState(false)

    const {
        challengeInfo,
        isLoadingChallengeInfo,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { isEdit }: useIsEditReviewProps = useIsEditReview()

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
        scorecardId,
        submissionInfo,
        saveReviewInfo,
    }: useFetchSubmissionReviewsProps = useFetchSubmissionReviews()

    const breadCrumb = useMemo<BreadCrumbData[]>(() => [
        {
            index: 1,
            label: 'Active Reviews',
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
            label: `Review Scorecard - ${params.submissionId}`,
        },
    ], [challengeInfo?.name, params.submissionId])

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
                                scorecardId={scorecardId}
                                saveReviewInfo={saveReviewInfo}
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
