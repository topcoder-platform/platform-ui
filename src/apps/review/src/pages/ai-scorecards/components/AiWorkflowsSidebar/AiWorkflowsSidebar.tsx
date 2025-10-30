import { FC, useMemo } from 'react'

import styles from './AiWorkflowsSidebar.module.scss'
import { useAiScorecardContext } from '../../AiScorecardContext'
import { AiScorecardContextModel } from '~/apps/review/src/lib/models'
import { AiWorkflowRunStatus } from '~/apps/review/src/lib/components/AiReviewsTable'
import classNames from 'classnames'
import { IconAiReview } from '~/apps/review/src/lib/assets/icons'
import StatusLabel from '~/apps/review/src/lib/components/AiReviewsTable/StatusLabel'
import { IconOutline } from '~/libs/ui'
import { Link } from 'react-router-dom'

interface AiWorkflowsSidebarProps {
    className?: string
}

const AiWorkflowsSidebar: FC<AiWorkflowsSidebarProps> = props => {
    const { workflowRuns, workflowId, submissionId }: AiScorecardContextModel = useAiScorecardContext()

    return (
        <div className={classNames(props.className, styles.wrap)}>
            <div className={styles.runsWrap}>
                <ul>
                    {workflowRuns.map(workflowRun => (
                        <li className={classNames(styles.runEntry, workflowId === workflowRun.workflow.id && styles.active)} key={workflowRun.id}>
                            <Link to={`../ai-scorecard/${submissionId}/${workflowRun.workflow.id}`} />
                            <span>
                                <IconAiReview />
                                <span className={styles.workflowName}>{workflowRun.workflow.name}</span>
                            </span>
                            <AiWorkflowRunStatus run={workflowRun} showScore hideLabel />
                        </li>
                    ))}
                </ul>
            </div>

            <div className={styles.legend}>
                <div className={styles.legendLabel}>
                    Legend
                </div>
                <ul>
                    <li>
                        <StatusLabel icon={<IconOutline.CheckIcon className='icon-xl' />} label='Passed' status="passed" />
                    </li>
                    <li>
                        <StatusLabel icon={<IconOutline.MinusCircleIcon className='icon-xl' />} label='Failed' status="failed" />
                    </li>
                    <li>
                        <StatusLabel icon={<IconOutline.MinusIcon className='icon-md' />} label='To be filled' status="pending" />
                    </li>
                </ul>
            </div>
        </div>
    )
}

export default AiWorkflowsSidebar
