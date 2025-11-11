import { FC, useState } from 'react'

import styles from './AiReviewViewer.module.scss'
import { ScorecardHeader } from '../ScorecardHeader'
import { Tabs } from '~/apps/review/src/lib'
import { ScorecardViewer } from '~/apps/review/src/lib/components/Scorecard'
import { ScorecardAttachments } from '~/apps/review/src/lib/components/Scorecard/ScorecardAttachments'
import { AiWorkflowRunItemsResponse, useFetchAiWorkflowsRunItems } from '~/apps/review/src/lib/hooks'
import { ReviewsContextModel, SelectOption } from '~/apps/review/src/lib/models'
import { useReviewsContext } from '../../ReviewsContext'

interface AiReviewViewerProps {
}

const tabItems: SelectOption[] = [
    { label: 'Scorecard', value: 'scorecard' },
    { label: 'Attachments', value: 'attachments' },
]

const AiReviewViewer: FC<AiReviewViewerProps> = props => {
    const { scorecard, workflowId, workflowRun }: ReviewsContextModel = useReviewsContext()
    const [selectedTab, setSelectedTab] = useState('scorecard')
    const { runItems }: AiWorkflowRunItemsResponse = useFetchAiWorkflowsRunItems(workflowId, workflowRun?.id)

    return (
        <div className={styles.wrap}>

            <ScorecardHeader />
            <Tabs
                className={styles.tabs}
                items={tabItems}
                selected={selectedTab}
                onChange={setSelectedTab}
            />
            {!!scorecard && selectedTab === 'scorecard' && (
                <ScorecardViewer
                    scorecard={scorecard}
                    aiFeedback={runItems}
                    score={workflowRun?.score}
                />
            )}

            {selectedTab === 'attachments' && (
                <ScorecardAttachments />
            )}
        </div>
    )
}

export default AiReviewViewer
