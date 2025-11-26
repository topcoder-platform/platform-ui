import { FC, useMemo, useState } from 'react'

import { Tabs } from '~/apps/review/src/lib'
import { ScorecardViewer } from '~/apps/review/src/lib/components/Scorecard'
import { ScorecardAttachments } from '~/apps/review/src/lib/components/Scorecard/ScorecardAttachments'
import {
    AiWorkflowRunAttachmentsResponse,
    AiWorkflowRunItemsResponse,
    AiWorkflowRunStatusEnum,
    useFetchAiWorkflowsRunAttachments,
    useFetchAiWorkflowsRunItems,
} from '~/apps/review/src/lib/hooks'
import { ReviewsContextModel, SelectOption } from '~/apps/review/src/lib/models'
import { AiWorkflowRunStatus } from '~/apps/review/src/lib/components/AiReviewsTable'

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

    const tabItems: SelectOption[] = [
        {
            indicator: workflowRun && (
                <>
                    <span className={styles.tabScore}>{workflowRun?.score ?? ''}</span>
                    <AiWorkflowRunStatus
                        run={workflowRun}
                        hideLabel
                    />
                </>
            ),
            label: 'Scorecard',
            value: 'scorecard',
        },
        { label: `Attachments (${totalCount ?? 0})`, value: 'attachments' },
    ]
    const isFailedRun = useMemo(() => (
        workflowRun && [
            AiWorkflowRunStatusEnum.CANCELLED,
            AiWorkflowRunStatusEnum.FAILURE,
        ].includes(workflowRun.status)
    ), [workflowRun])

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
