import { FC, PropsWithChildren, useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { IconOutline, Tooltip } from '~/libs/ui'
import { handleError } from '~/libs/shared/lib/utils/handle-error'

import {
    aiRunFailed,
    aiRunInProgress,
    AiWorkflowRun,
    retriggerAiWorkflowRun,
    useRolePermissions,
    UseRolePermissionsResult,
} from '../../hooks'

import StatusLabel from './StatusLabel'
import styles from './AiWorkflowRunStatus.module.scss'

interface AiWorkflowRunStatusProps {
    run?: Pick<AiWorkflowRun, 'status'|'score'|'workflow'|'id'>
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
    const [isRerunning, setIsRerunning] = useState(false)
    const [isLocallyPending, setIsLocallyPending] = useState(false)
    const { isAdmin }: UseRolePermissionsResult = useRolePermissions()

    const status = useMemo(() => {
        if (props.status) {
            return props.status
        }

        if (props.run) {
            return aiRunStatus(props.run)
        }

        return ''
    }, [props.status, props.run])

    const displayStatus = isLocallyPending ? 'pending' : status

    const handleRerun = useCallback(async (): Promise<void> => {
        const runId = props.run?.id
        if (!runId || runId === '-1') {
            return
        }

        setIsRerunning(true)

        try {
            await retriggerAiWorkflowRun(runId)
            setIsLocallyPending(true)
            toast.success('Workflow re-run triggered successfully.')
        } catch (error) {
            handleError(error as Error)
            toast.error('Failed to trigger workflow re-run.')
        } finally {
            setIsRerunning(false)
        }
    }, [props.run])

    const score: number | undefined = props.showScore ? (props.score ?? props.run?.score) : undefined

    const Wrapper: FC<PropsWithChildren> = useCallback(({ children }: PropsWithChildren) => {
        if (!isAdmin || displayStatus === 'pending' || !props.run?.id || props.run?.id === '-1') {
            return <>{children}</>
        }

        return (
            <Tooltip
                clickable
                content={(
                    <button
                        type='button'
                        className={styles.reRunButton}
                        disabled={isRerunning}
                        onClick={handleRerun}
                    >
                        <IconOutline.ArrowRightIcon className='icon-sm' style={{ marginRight: '0.5rem' }} />
                        {isRerunning ? 'Re-running...' : 'Re-run'}
                    </button>
                )}
            >
                {children}
            </Tooltip>
        )
    }, [isAdmin, displayStatus, props.run, isRerunning])

    return (
        <Wrapper>
            {displayStatus === 'passed' && (
                <StatusLabel
                    icon={<IconOutline.CheckIcon className='icon-xl' />}
                    hideLabel={props.hideLabel}
                    label='Passed'
                    status={displayStatus}
                    score={score}
                />
            )}
            {displayStatus === 'failed-score' && (
                <StatusLabel
                    icon={<IconOutline.MinusCircleIcon className='icon-xl' />}
                    hideLabel={props.hideLabel}
                    label='Failed'
                    status={displayStatus}
                    score={score}
                />
            )}
            {displayStatus === 'pending' && (
                <StatusLabel
                    icon={<IconOutline.MinusIcon className='icon-md' />}
                    hideLabel={props.hideLabel}
                    label='To be filled'
                    status={displayStatus}
                    score={score}
                />
            )}
            {displayStatus === 'failed' && (
                <StatusLabel
                    icon={<IconOutline.XCircleIcon className='icon-xl' />}
                    hideLabel={props.hideLabel}
                    status={displayStatus}
                    label='Failure'
                    score={score}
                />
            )}
        </Wrapper>
    )
}
