import { FC, useEffect, useMemo, useState } from 'react'

import { NotificationContextType, useNotification } from '~/libs/shared'

import { ScorecardHeader } from '../components/ScorecardHeader'
import { IconAiReview } from '../../../lib/assets/icons'
import { PageWrapper, Tabs } from '../../../lib'
import { useAiScorecardContext } from '../AiScorecardContext'
import { AiScorecardContextModel, SelectOption } from '../../../lib/models'
import { AiWorkflowsSidebar } from '../components/AiWorkflowsSidebar'
import { ScorecardViewer } from '../../../lib/components/Scorecard'
import { AiWorkflowRunItemsResponse, useFetchAiWorkflowsRunItems } from '../../../lib/hooks'
import { ScorecardAttachments } from '../../../lib/components/Scorecard/ScorecardAttachments'

import styles from './AiScorecardViewer.module.scss'

const tabItems: SelectOption[] = [
    { label: 'Scorecard', value: 'scorecard' },
    { label: 'Attachments', value: 'attachments' },
]

const AiScorecardViewer: FC = () => {
    const { showBannerNotification, removeNotification }: NotificationContextType = useNotification()
    const { challengeInfo, scorecard, workflowId, workflowRun }: AiScorecardContextModel = useAiScorecardContext()
    const { runItems }: AiWorkflowRunItemsResponse = useFetchAiWorkflowsRunItems(workflowId, workflowRun?.id)

    const breadCrumb = useMemo(
        () => [{ index: 1, label: 'My Active Challenges' }],
        [],
    )

    const [selectedTab, setSelectedTab] = useState('scorecard')

    useEffect(() => {
        const notification = showBannerNotification({
            icon: <IconAiReview />,
            id: 'ai-review-icon-notification',
            message: `Challenges with this icon indicate that
                one or more AI reviews will be conducted for each member submission.`,
        })
        return () => notification && removeNotification(notification.id)
    }, [showBannerNotification, removeNotification])

    return (
        <PageWrapper
            pageTitle={challengeInfo?.name ?? ''}
            className={styles.container}
            breadCrumb={breadCrumb}
        >
            <div className={styles.pageContentWrap}>
                <AiWorkflowsSidebar className={styles.sidebar} />
                <div className={styles.contentWrap}>
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
            </div>
        </PageWrapper>
    )
}

export default AiScorecardViewer
