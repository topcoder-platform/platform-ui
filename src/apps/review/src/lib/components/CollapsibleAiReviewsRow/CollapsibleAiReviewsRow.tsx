import { FC, useCallback, useContext, useMemo, useState } from 'react'
import classNames from 'classnames'

import { IconOutline, Tooltip } from '~/libs/ui'

import { AiReviewsTable, AiWorkflowRunStatus } from '../AiReviewsTable'
import {
    AiReviewConfigWorkflow,
    AiReviewDecision,
    AiReviewDecisionStatus,
    BackendSubmission,
    ChallengeDetailContextModel,
} from '../../models'
import { ChallengeDetailContext } from '../../contexts'

import styles from './CollapsibleAiReviewsRow.module.scss'

interface CollapsibleAiReviewsRowProps {
    className?: string
    defaultOpen?: boolean
    aiReviewers: { aiWorkflowId: string }[]
    submission: Pick<BackendSubmission, 'id'|'virusScan'>
}

function formatScore(value?: number | null): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-'
    }
    return value.toFixed(2)
}

function formatWeight(value?: number): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-'
    }
    return `${value.toFixed(0)}%`
}

function normalizeDecisionStatus(
    status?: AiReviewDecisionStatus,
): 'passed' | 'failed-score' | 'pending' | 'failed' {
    if (!status || status === 'PENDING') {
        return 'pending'
    }
    if (status === 'PASSED') {
        return 'passed'
    }
    if (status === 'FAILED') {
        return 'failed-score'
    }
    if (status === 'ERROR') {
        return 'failed'
    }
    return 'pending'
}

function getConfiguredWorkflowName(workflow?: AiReviewConfigWorkflow['workflow']): string | undefined {
    const configuredName = workflow?.name?.trim()
    return configuredName || undefined
}

const CollapsibleAiReviewsRow: FC<CollapsibleAiReviewsRowProps> = props => {
    const challengeDetailContext: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const aiReviewConfig: ChallengeDetailContextModel['aiReviewConfig'] = challengeDetailContext.aiReviewConfig
    const aiReviewDecisionsBySubmissionId: ChallengeDetailContextModel['aiReviewDecisionsBySubmissionId']
        = challengeDetailContext.aiReviewDecisionsBySubmissionId

    const aiReviewersCount = useMemo(() => {
        const reviewersCount = props.aiReviewers.length || aiReviewConfig?.workflows?.length || 0
        return reviewersCount + 1
    }, [aiReviewConfig?.workflows?.length, props.aiReviewers.length])

    const currentDecision = useMemo<AiReviewDecision | undefined>(
        () => aiReviewDecisionsBySubmissionId[props.submission.id],
        [aiReviewDecisionsBySubmissionId, props.submission.id],
    )

    const configuredWorkflows = useMemo<AiReviewConfigWorkflow[]>(
        () => aiReviewConfig?.workflows ?? [],
        [aiReviewConfig],
    )

    const normalizedStatus = useMemo(
        () => normalizeDecisionStatus(currentDecision?.status),
        [currentDecision?.status],
    )

    const formulaTooltip = useMemo(() => {
        if (!aiReviewConfig || !configuredWorkflows.length) {
            return undefined
        }

        const formulaLines = configuredWorkflows.map((workflow, i) => {
            const label = getConfiguredWorkflowName(workflow.workflow) ?? 'AI Reviewer'
            return `${!i ? '' : '+ '}${formatWeight(workflow.weightPercent)} * ${label}`
        })

        return (
            <div className={styles.infoTooltipContent}>
                <div className={styles.infoTooltipRow}>
                    <strong>Min Passing Score</strong>
                    <span>{formatScore(aiReviewConfig.minPassingThreshold)}</span>
                </div>
                <div className={styles.infoTooltipTitle}>AI Score Formula</div>
                <div className={styles.infoTooltipLine}>
                    Overall Score =
                    {' '}
                    {formulaLines[0]}
                </div>
                {formulaLines.slice(1).map(line => (
                    <div key={line} className={classNames(styles.infoTooltipLine, styles.indent)}>{line}</div>
                ))}
            </div>
        )
    }, [aiReviewConfig, configuredWorkflows])

    const [isOpen, setIsOpen] = useState(props.defaultOpen ?? false)

    const toggleOpen = useCallback(() => {
        setIsOpen(wasOpen => !wasOpen)
    }, [])

    const hasScore = currentDecision?.totalScore !== null && currentDecision?.totalScore !== undefined

    return (
        <div className={classNames(props.className, styles.wrap)}>
            <div className={classNames(styles.header, 'trigger')} onClick={toggleOpen}>
                <span className={classNames(styles.reviewersDropdown)}>
                    {aiReviewersCount}
                    {' '}
                    AI Reviewer
                    {aiReviewersCount === 1 ? '' : 's'}
                    <IconOutline.ChevronDownIcon className={classNames('icon-xl', isOpen && styles.rotated)} />
                </span>
                <div className={styles.statusContainer}>
                    {hasScore && (
                        <span className={classNames(
                            styles.score,
                            normalizedStatus === 'passed' && styles.scorePassed,
                            (normalizedStatus === 'failed' || normalizedStatus === 'failed-score') && styles.scoreFailed,
                        )}
                        >
                            {formulaTooltip && (
                                <Tooltip content={formulaTooltip} triggerOn='hover'>
                                    <span className={styles.infoIcon}>
                                        <IconOutline.InformationCircleIcon className='icon-lg' />
                                    </span>
                                </Tooltip>
                            )}
                            {formatScore(currentDecision!.totalScore)}
                        </span>
                    )}
                    {currentDecision && (
                        <div className={styles.runStatus}>
                            <AiWorkflowRunStatus status={normalizedStatus} showScore={false} />
                        </div>
                    )}
                </div>
            </div>
            {isOpen && (
                <div className={classNames(styles.table, 'reviews-table')}>
                    <AiReviewsTable submission={props.submission} aiReviewers={props.aiReviewers} />
                </div>
            )}
        </div>
    )
}

export default CollapsibleAiReviewsRow
