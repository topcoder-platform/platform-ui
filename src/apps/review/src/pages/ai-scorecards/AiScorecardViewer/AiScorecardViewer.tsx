import { FC, useEffect, useMemo } from 'react'

import styles from './AiScorecardViewer.module.scss'
import { ScorecardHeader } from '../components/ScorecardHeader'
import { NotificationContextType, useNotification } from '~/libs/shared'
import { IconAiReview } from '../../../lib/assets/icons'
import { PageWrapper } from '../../../lib'
import { useAiScorecardContext } from '../AiScorecardContext'
import { AiScorecardContextModel } from '../../../lib/models'
import { AiWorkflowsSidebar } from '../components/AiWorkflowsSidebar'

interface AiScorecardViewerProps {
}

const AiScorecardViewer: FC<AiScorecardViewerProps> = props => {

    const { showBannerNotification, removeNotification }: NotificationContextType = useNotification()
    const { challengeInfo, workflowRuns }: AiScorecardContextModel = useAiScorecardContext()

    const breadCrumb = useMemo(
        () => [{ index: 1, label: 'My Active Challenges' }],
        [],
    )

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
            <div className={styles.contentWrap}>
                <AiWorkflowsSidebar className={styles.sidebar} />
                <ScorecardHeader />
            </div>
        </PageWrapper>
    )
}

export default AiScorecardViewer
