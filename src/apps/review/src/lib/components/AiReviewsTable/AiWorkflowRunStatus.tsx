import { FC, useMemo } from 'react'

import { IconOutline } from '~/libs/ui'

import { aiRunFailed, aiRunInProgress, AiWorkflowRun } from '../../hooks'

import StatusLabel from './StatusLabel'

interface AiWorkflowRunStatusProps {
    run: Pick<AiWorkflowRun, 'status'|'score'|'workflow'>
    hideLabel?: boolean
    showScore?: boolean
}

export const AiWorkflowRunStatus: FC<AiWorkflowRunStatusProps> = props => {
    const isInProgress = useMemo(() => aiRunInProgress(props.run), [props.run.status])
    const isFailed = useMemo(() => aiRunFailed(props.run), [props.run.status])
    const isPassing = (
        props.run.status === 'SUCCESS'
        && props.run.score >= (props.run.workflow.scorecard?.minimumPassingScore ?? 0)
    )
    const status = isInProgress ? 'pending' : isFailed ? 'failed' : (
        isPassing ? 'passed' : 'failed-score'
    )

    const score = props.showScore ? props.run.score : undefined

    return (
        <>
            {props.run.status === 'SUCCESS' && isPassing && (
                <StatusLabel
                    icon={<IconOutline.CheckIcon className='icon-xl' />}
                    hideLabel={props.hideLabel}
                    label='Passed'
                    status={status}
                    score={score}
                />
            )}
            {props.run.status === 'SUCCESS' && !isPassing && (
                <StatusLabel
                    icon={<IconOutline.MinusCircleIcon className='icon-xl' />}
                    hideLabel={props.hideLabel}
                    label='Failed'
                    status={status}
                    score={score}
                />
            )}
            {isInProgress && (
                <StatusLabel
                    icon={<IconOutline.MinusIcon className='icon-md' />}
                    hideLabel={props.hideLabel}
                    label='To be filled'
                    status={status}
                    score={score}
                />
            )}
            {isFailed && (
                <StatusLabel
                    icon={<IconOutline.XCircleIcon className='icon-xl' />}
                    status={status}
                    score={score}
                />
            )}
        </>
    )
}
