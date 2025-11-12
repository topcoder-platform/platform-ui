import { FC, useMemo } from 'react'

import { IconOutline } from '~/libs/ui'

import { aiRunFailed, aiRunInProgress, AiWorkflowRun } from '../../hooks'

import StatusLabel from './StatusLabel'

interface AiWorkflowRunStatusProps {
    run?: Pick<AiWorkflowRun, 'status'|'score'|'workflow'>
    status?: 'passed' | 'pending' | 'failed-score'
    score?: number
    hideLabel?: boolean
    showScore?: boolean
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

    const score = props.showScore ? (props.score ?? props.run?.score) : undefined

    return (
        <>
            {status === 'passed' && (
                <StatusLabel
                    icon={<IconOutline.CheckIcon className='icon-xl' />}
                    hideLabel={props.hideLabel}
                    label='Passed'
                    status={status}
                    score={score}
                />
            )}
            {status === 'failed-score' && (
                <StatusLabel
                    icon={<IconOutline.MinusCircleIcon className='icon-xl' />}
                    hideLabel={props.hideLabel}
                    label='Failed'
                    status={status}
                    score={score}
                />
            )}
            {status === 'pending' && (
                <StatusLabel
                    icon={<IconOutline.MinusIcon className='icon-md' />}
                    hideLabel={props.hideLabel}
                    label='To be filled'
                    status={status}
                    score={score}
                />
            )}
            {status === 'failed' && (
                <StatusLabel
                    icon={<IconOutline.XCircleIcon className='icon-xl' />}
                    status={status}
                    score={score}
                />
            )}
        </>
    )
}
