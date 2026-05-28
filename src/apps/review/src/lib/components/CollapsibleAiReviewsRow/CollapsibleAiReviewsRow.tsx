import { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames'

import { IconOutline, Tooltip } from '~/libs/ui'

import { AiReviewsTable, AiWorkflowRunStatus } from '../AiReviewsTable'
import {
    AiReviewDecision,
    AiReviewDecisionEscalation,
    AiReviewDecisionStatus,
    BackendSubmission,
    ChallengeDetailContextModel,
} from '../../models'
import { ChallengeDetailContext } from '../../contexts'
import { AiScoreFormulaTooltip } from '../AiScoreFormulaTooltip'
import { formatScore } from '../AiScoreFormulaTooltip/AiScoreFormulaTooltip'
import { useRolePermissions, UseRolePermissionsResult } from '../../hooks'

import styles from './CollapsibleAiReviewsRow.module.scss'

interface CollapsibleAiReviewsRowProps {
    className?: string
    defaultOpen?: boolean
    aiReviewers: { aiWorkflowId: string }[]
    submission: Pick<BackendSubmission, 'id'|'virusScan'>
}

export function normalizeDecisionStatus(
    status?: AiReviewDecisionStatus,
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
        return 'human-override'
    }

    return 'pending'
}

/**
 * Builds a multi-line tooltip string from escalation notes and approver notes.
 * Returns undefined if there are no notes at all.
 * Used to show Copilot/Manager/Admin why a submission was escalated or
 * approved/rejected.
 */
function buildNotesTooltip(
    escalations?: AiReviewDecisionEscalation[],
    resourceMemberIdMapping?: Record<string, any>,
): string | undefined {
    const parts: string[] = []

    const getMemberHandle = (memberId?: string | null): string => {
        if (!memberId || !resourceMemberIdMapping) return ''
        const resource = resourceMemberIdMapping[memberId]
        return resource?.memberHandle || ''
    }

    escalations?.forEach(esc => {
        if (esc.escalationNotes) {
            const by = esc.createdBy ? ` (by ${getMemberHandle(esc.createdBy)})` : ''
            parts.push(`Escalation Note${by}: ${esc.escalationNotes}`)
        }

        if (esc.approverNotes) {
            const by = esc.updatedBy ? ` (by ${getMemberHandle(esc.updatedBy)})` : ''
            const prefix = esc.status === 'APPROVED'
                ? 'Approval Note'
                : esc.status === 'REJECTED'
                    ? 'Rejection Note'
                    : 'Approver Note'
            parts.push(`${prefix}${by}: ${esc.approverNotes}`)
        }
    })

    return parts.length ? parts.join('\n') : undefined
}

const CollapsibleAiReviewsRow: FC<CollapsibleAiReviewsRowProps> = props => {
    const challengeDetailContext: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const aiReviewConfig: ChallengeDetailContextModel['aiReviewConfig'] = challengeDetailContext.aiReviewConfig
    const aiReviewDecisionsBySubmissionId: ChallengeDetailContextModel['aiReviewDecisionsBySubmissionId']
        = challengeDetailContext.aiReviewDecisionsBySubmissionId

    const { hasSubmitterRole }: UseRolePermissionsResult = useRolePermissions()

    const aiReviewersCount = useMemo(() => {
        const reviewersCount = props.aiReviewers.length || aiReviewConfig?.workflows?.length || 0
        return reviewersCount + 1
    }, [aiReviewConfig?.workflows?.length, props.aiReviewers.length])

    const currentDecision = useMemo<AiReviewDecision | undefined>(
        () => aiReviewDecisionsBySubmissionId[props.submission.id],
        [aiReviewDecisionsBySubmissionId, props.submission.id],
    )

    const normalizedStatus = useMemo(
        () => normalizeDecisionStatus(currentDecision?.status),
        [currentDecision?.status],
    )

    const resourceMemberIdMapping = challengeDetailContext.resourceMemberIdMapping

    /**
     * Builds the tooltip text for the notes icon shown next to the status label.
     * Only shown to Copilot/Manager/Admin (not submitters).
     * Covers: escalation notes and approval/rejection notes.
     */
    const notesTooltip = useMemo((): string | undefined => {
        if (hasSubmitterRole || !currentDecision) return undefined

        return buildNotesTooltip(currentDecision.escalations, resourceMemberIdMapping)
    }, [currentDecision, hasSubmitterRole, resourceMemberIdMapping])

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
                        <span className={classNames(
                            styles.score,
                            normalizedStatus === 'passed' && styles.scorePassed,
                            (
                                normalizedStatus === 'failed' || normalizedStatus === 'failed-score'
                            ) && styles.scoreFailed,
                        )}
                        >
                            <Tooltip
                                content={<AiScoreFormulaTooltip aiReviewConfig={aiReviewConfig} />}
                                triggerOn='hover'
                            >
                                <span className={styles.infoIcon}>
                                    <IconOutline.InformationCircleIcon className='icon-lg' />
                                </span>
                            </Tooltip>
                            {formatScore(currentDecision!.totalScore)}
                        </span>
                    )}
                    {currentDecision && (
                        <div className={styles.runStatus}>
                            <AiWorkflowRunStatus status={normalizedStatus} showScore={false} />
                            {/*
                             * Notes icon: shown only to Copilot/Manager/Admin (not submitters)
                             * when there are escalation notes, approval/rejection notes,
                             * or an unlock reason to display.
                             */}
                            {notesTooltip && (
                                <Tooltip
                                    content={(
                                        <div className={styles.notesTooltipContent}>
                                            {notesTooltip.split('\n')
                                                .map((line, i) => (
                                                // eslint-disable-next-line react/no-array-index-key
                                                    <div key={i} className={styles.notesTooltipLine}>{line}</div>
                                                ))}
                                        </div>
                                    )}
                                    triggerOn='hover'
                                >
                                    <span className={styles.notesIcon}>
                                        <IconOutline.ClipboardListIcon className='icon-lg' />
                                    </span>
                                </Tooltip>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {isOpen && portalContainer && createPortal(
                <div className={classNames(styles.table, 'reviews-table')}>
                    <AiReviewsTable submission={props.submission} aiReviewers={props.aiReviewers} />
                </div>,
                portalContainer,
            )}
        </div>
    )
}

export default CollapsibleAiReviewsRow
