/**
 * Scorecard Details Page.
 */
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import classNames from 'classnames'

import {
    useFetchChallengeInfo,
    useFetchChallengeInfoProps,
    useRole,
} from '../../../lib/hooks'
import {
    ChallengeLinks,
    ConfirmModal,
    PageWrapper,
    ScorecardDetails,
} from '../../../lib'
import { SubmissionInfo } from '../../../lib/models'
import { SubmissionBarInfo } from '../../../lib/components/SubmissionBarInfo'
import { SUBMITTER } from '../../../config/index.config'

import styles from './ScorecardDetailsPage.module.scss'

interface Props {
    className?: string
}

export const ScorecardDetailsPage: FC<Props> = (props: Props) => {
    const navigate = useNavigate()
    const params = useParams()
    const { role }: { role: string} = useRole()
    const [showCloseConfirmation, setShowCloseConfirmation] = useState<boolean>(false)
    const [isChanged, setIsChanged] = useState(false)
    const { challengeInfo, submissions }: useFetchChallengeInfoProps
        = useFetchChallengeInfo(params.challengeId)
    const [searchParams] = useSearchParams()
    const [submission, setSubmission] = useState<SubmissionInfo>()
    const isEdit = useMemo(
        () => searchParams.get('viewMode') !== 'true',
        [searchParams],
    )

    const breadCrumb = useMemo(() => [
        {
            index: 1,
            label: 'Active Reviews',
            path: '/review/active-review-assigments/',
        },
        { index: 2, label: challengeInfo?.name, path: -1 },
        {
            index: 3,
            label: `Review Scorecard - ${params.scorecardId}`,
        },
    ], [challengeInfo?.name, params.scorecardId])

    const onCancelEdit = useCallback(() => {
        if (isChanged && isEdit) {
            setShowCloseConfirmation(true)
        } else {
            navigate('./../../challenge-details')
        }
    }, [isChanged, isEdit, navigate])

    useEffect(() => {
        if (submissions) {
            setSubmission(
                submissions.find(s => s.id === params.scorecardId),
            )
        }
    }, [submissions, params.scorecardId])

    useEffect(() => {
        if (role === SUBMITTER && isEdit) {
            navigate('./../../challenge-details')
        }
    }, [role, isEdit, navigate])

    return (
        <PageWrapper
            pageTitle={challengeInfo?.name ?? ''}
            className={classNames(styles.container, props.className)}
            titleUrl='emptyLink'
            breadCrumb={breadCrumb}
        >
            <div className={styles.summary}>
                {submission && <SubmissionBarInfo submission={submission} />}
                <ChallengeLinks />
            </div>

            <ScorecardDetails
                isEdit={isEdit}
                onCancelEdit={onCancelEdit}
                setIsChanged={setIsChanged}
            />

            {isEdit && (
                <ConfirmModal
                    title='Discard Confirmation'
                    action='discard'
                    onClose={function onClose() {
                        setShowCloseConfirmation(false)
                    }}
                    onConfirm={function onConfirm() {
                        navigate(-1)
                    }}
                    open={showCloseConfirmation}
                    maxWidth='578px'
                >
                    <div>Are you sure you want to discard the changes?</div>
                </ConfirmModal>
            )}
        </PageWrapper>
    )
}

export default ScorecardDetailsPage
