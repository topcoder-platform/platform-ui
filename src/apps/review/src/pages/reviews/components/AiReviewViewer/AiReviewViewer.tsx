import { FC, useCallback, useMemo, useState } from 'react'
import { mutate } from 'swr'
import classNames from 'classnames'

import { Tabs, useChallengeDetailsContext } from '~/apps/review/src/lib'
import { ScorecardViewer } from '~/apps/review/src/lib/components/Scorecard'
import { ScorecardAttachments } from '~/apps/review/src/lib/components/Scorecard/ScorecardAttachments'
import {
    AiWorkflowRunAttachmentsResponse,
    AiWorkflowRunItemsResponse,
    AiWorkflowRunStatusEnum,
    useAppNavigate,
    useFetchAiWorkflowsRunAttachments,
    useFetchAiWorkflowsRunItems,
} from '~/apps/review/src/lib/hooks'
import { ChallengeDetailContextModel, ReviewsContextModel, SelectOption } from '~/apps/review/src/lib/models'
import { AiWorkflowRunStatus } from '~/apps/review/src/lib/components/AiReviewsTable'
import { rootRoute } from '~/apps/review/src/config/routes.config'

import { ScorecardHeader } from '../ScorecardHeader'
import { useReviewsContext } from '../../ReviewsContext'

import styles from './AiReviewViewer.module.scss'

const AiReviewViewer: FC = () => {
    const { scorecard, workflowId, workflowRun, setActionButtons }: ReviewsContextModel = useReviewsContext()
    const [selectedTab, setSelectedTab] = useState('scorecard')
    const { runItems }: AiWorkflowRunItemsResponse = useFetchAiWorkflowsRunItems(
        workflowId,
        workflowRun?.id,
        workflowRun?.status,
    )
    const { totalCount }: AiWorkflowRunAttachmentsResponse
        = useFetchAiWorkflowsRunAttachments(workflowId, workflowRun?.id)
    const {
        challengeInfo,
    }: ChallengeDetailContextModel = useChallengeDetailsContext()
    const navigate = useAppNavigate()
    const workflowRunIsFailed = [
        AiWorkflowRunStatusEnum.FAILURE,
    ].includes(workflowRun?.status as AiWorkflowRunStatusEnum)

    const tabItems: SelectOption[] = [
        {
            indicator: workflowRun && (
                <>
                    <span className={classNames(styles.tabScore, {
                        [styles.selected]: selectedTab === 'scorecard',
                    })}
                    >
                        {workflowRun?.score ?? ''}
                    </span>
                    <AiWorkflowRunStatus
                        run={workflowRun}
                        hideLabel
                    />
                </>
            ),
            label: 'Scorecard',
            value: 'scorecard',
        },
        { label: `Attachments${workflowRunIsFailed ? '' : ` (${totalCount ?? 0})`}`, value: 'attachments' },
    ]
    const isFailedRun = useMemo(() => (
        workflowRun && [
            AiWorkflowRunStatusEnum.CANCELLED,
            AiWorkflowRunStatusEnum.FAILURE,
        ].includes(workflowRun.status)
    ), [workflowRun])

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

    return (
        <div className={styles.wrap}>

            <ScorecardHeader />
            <Tabs
                className={styles.tabs}
                items={tabItems}
                selected={selectedTab}
                onChange={setSelectedTab}
            />

            {isFailedRun ? (
                <div>
                    AI run failed - no scorecard results are available
                </div>
            ) : (
                <>
                    {!!scorecard && selectedTab === 'scorecard' && (
                        <ScorecardViewer
                            scorecard={scorecard}
                            aiFeedback={runItems}
                            setActionButtons={setActionButtons}
                            navigateBack={back}
                        />
                    )}

                    {selectedTab === 'attachments' && (
                        <ScorecardAttachments />
                    )}
                </>
            )}
        </div>
    )
}

export default AiReviewViewer
