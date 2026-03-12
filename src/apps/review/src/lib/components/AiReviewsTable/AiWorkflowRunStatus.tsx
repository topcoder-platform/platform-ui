import { FC, ReactNode, useMemo } from 'react'
import { IconOutline } from '~/libs/ui'

import { aiRunFailed, aiRunInProgress, AiWorkflowRun } from '../../hooks'

import StatusLabel from './StatusLabel'

interface AiWorkflowRunStatusProps {
    run?: Pick<AiWorkflowRun, 'status'|'score'|'workflow'|'id'>
    status?: 'passed' | 'pending' | 'failed-score' | 'failed'
    score?: number
    hideLabel?: boolean
    showScore?: boolean
    action?: ReactNode
}

const aiRunStatus = (run: Pick<AiWorkflowRun, 'status'|'score'|'workflow'>): string => {
    const isInProgress = aiRunInProgress(run)
    const isFailed = aiRunFailed(run)
    const isPassing = (
        run.status === 'SUCCESS'
        && run.score >= (run.workflow.scorecard?.minimumPassingScore ?? 0)
    )
    return isInProgress ? 'pending' : isFailed ? 'failed' : (
        isPassing ? 'passed' : 'failed-score'
    )
}

export const AiWorkflowRunStatus: FC<AiWorkflowRunStatusProps> = props => {
    const status = useMemo(() => {
        if (props.status) {
            return props.status
        }

        if (props.run) {
            return aiRunStatus(props.run)
        }

        return ''
    }, [props.status, props.run])

    const displayStatus = status
    const score: number | undefined = props.showScore ? (props.score ?? props.run?.score) : undefined

    return (
        <>
            {displayStatus === 'passed' && (
                <StatusLabel
                    icon={<IconOutline.CheckIcon className='icon-xl' />}
                    hideLabel={props.hideLabel}
                    label='Passed'
                    status={displayStatus}
                    score={score}
                    action={props.action}
                />
            )}
            {displayStatus === 'failed-score' && (
                <StatusLabel
                    icon={<IconOutline.MinusCircleIcon className='icon-xl' />}
                    hideLabel={props.hideLabel}
                    label='Failed'
                    status={displayStatus}
                    score={score}
                    action={props.action}
                />
            )}
            {displayStatus === 'pending' && (
                <StatusLabel
                    icon={<IconOutline.MinusIcon className='icon-md' />}
                    hideLabel={props.hideLabel}
                    label='To be filled'
                    status={displayStatus}
                    score={score}
                    action={props.action}
                />
            )}
            {displayStatus === 'failed' && (
                <StatusLabel
                    icon={<IconOutline.XCircleIcon className='icon-xl' />}
                    hideLabel={props.hideLabel}
                    status={displayStatus}
                    label='Failure'
                    score={score}
                    action={props.action}
                />
            )}
        </>
    )
}
