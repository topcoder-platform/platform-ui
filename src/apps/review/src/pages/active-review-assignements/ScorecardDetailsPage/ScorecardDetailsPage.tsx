/**
 * Scorecard Details Page.
 */
import { FC, useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import classNames from 'classnames'

import {
    useFetchOnlyChallengeInfo,
    useFetchOnlyChallengeInfoProps,
} from '../../../lib/hooks'
import {
    ChallengeLinks,
    ChallengePhaseInfo,
    ConfirmModal,
    PageWrapper,
    ScorecardDetails,
} from '../../../lib'

import styles from './ScorecardDetailsPage.module.scss'

interface Props {
    className?: string
}

export const ScorecardDetailsPage: FC<Props> = (props: Props) => {
    const navigate = useNavigate()
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
    const [isChanged, setIsChanged] = useState(false)
    const { challengeInfo }: useFetchOnlyChallengeInfoProps
        = useFetchOnlyChallengeInfo()
    const [searchParams] = useSearchParams()
    const isEdit = useMemo(
        () => searchParams.get('viewMode') !== 'true',
        [searchParams],
    )

    const onCancelEdit = useCallback(() => {
        if (isChanged && isEdit) {
            setShowCloseConfirmation(true)
        } else {
            navigate('./../../challenge-details')
        }
    }, [isChanged, isEdit, navigate])

    return (
        <PageWrapper
            pageTitle={challengeInfo?.name ?? ''}
            className={classNames(styles.container, props.className)}
            backUrl={isEdit ? '' : './../../challenge-details'}
            backAction={isEdit ? onCancelEdit : undefined}
            rightHeader={<ChallengeLinks />}
            titleUrl='emptyLink'
        >
            {challengeInfo && (
                <ChallengePhaseInfo challengeInfo={challengeInfo} />
            )}

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
                        navigate('./../../challenge-details')
                    }}
                    open={showCloseConfirmation}
                >
                    <div>Are you sure you want to discard the changes?</div>
                </ConfirmModal>
            )}
        </PageWrapper>
    )
}

export default ScorecardDetailsPage
