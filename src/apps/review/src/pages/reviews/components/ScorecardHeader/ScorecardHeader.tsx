import { FC, useCallback, useMemo, useState } from 'react'
import moment, { Duration } from 'moment'

import { ReviewsContextModel } from '~/apps/review/src/lib/models'
import { useRolePermissions, UseRolePermissionsResult } from '~/apps/review/src/lib/hooks'

import { IconClock, IconFile, IconPremium } from '../../../../lib/assets/icons'
import { AiModelModal } from '../AiModelModal'
import { useReviewsContext } from '../../ReviewsContext'
import AiModelIcon from '../AiModelIcon'

import styles from './ScorecardHeader.module.scss'

const formatDuration = (duration: Duration): string => [
    !!duration.hours() && `${duration.hours()}h`,
    !!duration.minutes() && `${duration.minutes()}m`,
    !!duration.seconds() && `${duration.seconds()}s`,
].filter(Boolean)
    .join(' ')

const ScorecardHeader: FC = () => {
    const { workflow, workflowRun }: ReviewsContextModel = useReviewsContext()
    const { isAdmin }: UseRolePermissionsResult = useRolePermissions()
    const runDuration = useMemo(() => (
        workflowRun && workflowRun.completedAt && workflowRun.startedAt && moment.duration(
            +new Date(workflowRun.completedAt) - +new Date(workflowRun.startedAt),
            'milliseconds',
        )
    ), [workflowRun])
    const [modelDetailsModalVisible, setModelDetailsModalVisible] = useState(false)

    const toggleModelDetails = useCallback(() => {
        setModelDetailsModalVisible(wasVisible => !wasVisible)
    }, [])

    if (!workflow || !workflowRun) {
        return <></>
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.headerWrap}>
                <div className={styles.workflowInfo}>
                    <div className={styles.workflowIcon}>
                        <AiModelIcon model={workflow.llm} />
                    </div>
                    <div className={styles.workflowName}>
                        <h3>{workflow.name}</h3>
                        <span className={styles.modelName} onClick={toggleModelDetails}>{workflow.llm.name}</span>
                    </div>
                </div>
                <div className={styles.workflowRunStats}>
                    <span>
                        <IconPremium />
                        <span>
                            <strong>Minimum passing score:</strong>
                            {' '}
                            {workflow.scorecard?.minimumPassingScore.toFixed(2)}
                        </span>
                    </span>
                    <span>
                        <IconClock />
                        <span>
                            <strong>Duration:</strong>
                            {' '}
                            {!!runDuration && formatDuration(runDuration)}
                        </span>
                    </span>
                    {isAdmin && (
                        <span>
                            <IconFile className={styles.sm} />
                            <span>
                                <strong>Git log:</strong>
                                {' '}
                                {workflowRun.gitRunUrl && (
                                    <a href={workflowRun.gitRunUrl} target='_blank' rel='noreferrer noopener'>
                                        #
                                        {workflowRun.gitRunId}
                                    </a>
                                )}
                            </span>
                        </span>
                    )}
                </div>
            </div>
            <p className={styles.workflowDescription}>
                {workflow.description}
            </p>
            {/* <div className={styles.workflowFileLink}>
                <a href={workflow.defUrl}>
                    Workflow File
                    {' '}
                    <IconExternalLink />
                </a>
            </div> */}

            {modelDetailsModalVisible && (
                <AiModelModal model={workflow.llm} onClose={toggleModelDetails} />
            )}
        </div>
    )
}

export default ScorecardHeader
