import { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames'

import { IconOutline, Tooltip } from '~/libs/ui'

import { AiReviewsTable, AiWorkflowRunStatus } from '../AiReviewsTable'
import {
    AiReviewDecision,
    AiReviewDecisionStatus,
    BackendSubmission,
    ChallengeDetailContextModel,
} from '../../models'
import { ChallengeDetailContext } from '../../contexts'
import { AiScoreFormulaTooltip } from '../AiScoreFormulaTooltip'
import { formatScore } from '../AiScoreFormulaTooltip/AiScoreFormulaTooltip'

import styles from './CollapsibleAiReviewsRow.module.scss'

interface CollapsibleAiReviewsRowProps {
    className?: string
    defaultOpen?: boolean
    aiReviewers: { aiWorkflowId: string }[]
    submission: Pick<BackendSubmission, 'id'|'virusScan'>
}

export function normalizeDecisionStatus(
    status?: AiReviewDecisionStatus,
    totalScore?: number | null,
    minPassingThreshold?: number | null,
): 'passed' | 'failed-score' | 'pending' | 'failed' | 'human-override' {
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

    if (status === 'HUMAN_OVERRIDE') {
        if (
            typeof totalScore === 'number'
            && typeof minPassingThreshold === 'number'
        ) {
            return totalScore >= minPassingThreshold ? 'passed' : 'failed-score'
        }

        return 'human-override'
    }

    return 'pending'
}

interface ScoreBadgeProps {
    score: number
    normalizedStatus: ReturnType<typeof normalizeDecisionStatus>
    aiReviewConfig: ChallengeDetailContextModel['aiReviewConfig']
}

const ScoreBadge: FC<ScoreBadgeProps> = props => (
    <span className={classNames(
        styles.score,
        props.normalizedStatus === 'passed' && styles.scorePassed,
        (props.normalizedStatus === 'failed' || props.normalizedStatus === 'failed-score') && styles.scoreFailed,
    )}
    >
        <Tooltip
            content={<AiScoreFormulaTooltip aiReviewConfig={props.aiReviewConfig} />}
            triggerOn='hover'
        >
            <span className={styles.infoIcon}>
                <IconOutline.InformationCircleIcon className='icon-lg' />
            </span>
        </Tooltip>
        {formatScore(props.score)}
    </span>
)

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

    const minPassingThreshold = currentDecision?.breakdown?.minPassingThreshold
        ?? aiReviewConfig?.minPassingThreshold

    // Extracted into its own memo to reduce the complexity count of the component arrow function
    const normalizedStatus = useMemo(
        () => normalizeDecisionStatus(
            currentDecision?.status,
            currentDecision?.totalScore,
            minPassingThreshold,
        ),
        [currentDecision?.status, currentDecision?.totalScore, minPassingThreshold],
    )

    const [isOpen, setIsOpen] = useState(props.defaultOpen ?? false)
    const [portalContainer, setPortalContainer] = useState<HTMLTableCellElement | undefined>(undefined)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const createdRowRef = useRef<HTMLTableRowElement | undefined>(undefined)

    const toggleOpen = useCallback(() => {
        setIsOpen(wasOpen => !wasOpen)
    }, [])

    useEffect(() => {
        // create portal row when opened
        if (isOpen && wrapperRef.current) {
            const parentTr = wrapperRef.current.closest('tr') as HTMLTableRowElement | null
            const parentTd = wrapperRef.current.closest('td') as HTMLTableCellElement | null
            const tbody = parentTr?.parentElement as HTMLTableSectionElement | null
            if (parentTr && tbody) {
                const createdTr = document.createElement('tr')
                const createdTd = document.createElement('td')
                const colCount = parentTd?.getAttribute('colSpan') ? parentTd.colSpan : parentTr.children.length || 1
                createdTd.colSpan = colCount
                createdTr.appendChild(createdTd)
                parentTr.insertAdjacentElement('afterend', createdTr)
                createdRowRef.current = createdTr
                setPortalContainer(createdTd)
            }
        }

        return () => {
            // cleanup created row
            const createdTr = createdRowRef.current
            if (createdTr && createdTr.parentElement) {
                createdTr.parentElement.removeChild(createdTr)
                createdRowRef.current = undefined
            }

            setPortalContainer(undefined)
        }
    }, [isOpen])

    const hasScore = currentDecision?.totalScore !== null && currentDecision?.totalScore !== undefined

    return (
        <div ref={wrapperRef} className={classNames(props.className, styles.wrap)}>
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
                        <ScoreBadge
                            score={currentDecision!.totalScore!}
                            normalizedStatus={normalizedStatus}
                            aiReviewConfig={aiReviewConfig}
                        />
                    )}
                    {currentDecision && (
                        <div className={styles.runStatus}>
                            <AiWorkflowRunStatus status={normalizedStatus} showScore={false} />
                        </div>
                    )}
                </div>
            </div>
            {isOpen && portalContainer && createPortal(
                <div className={classNames(styles.table, 'reviews-table')}>
                    <AiReviewsTable
                        submission={props.submission}
                        aiReviewers={props.aiReviewers}
                    />
                </div>,
                portalContainer,
            )}
        </div>
    )
}

export default CollapsibleAiReviewsRow
