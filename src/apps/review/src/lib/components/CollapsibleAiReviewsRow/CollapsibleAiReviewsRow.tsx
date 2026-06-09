import { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames'

import { IconOutline, Tooltip } from '~/libs/ui'

import { AiReviewsTable, AiWorkflowRunStatus } from '../AiReviewsTable'
import {
    AiReviewDecision,
    AiReviewDecisionEscalation,
    AiReviewDecisionStatus,
    BackendResource,
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
 * Resolves a memberId to a display handle using the resourceMemberIdMapping.
 * Falls back to the raw id string if no match is found.
 */
function resolveHandle(
    memberId: string | null | undefined,
    resourceMemberIdMapping: Record<string, BackendResource>,
): string {
    if (!memberId) return ''
    return resourceMemberIdMapping[memberId]?.memberHandle ?? memberId
}

/**
 * Builds a multi-line tooltip string from escalation notes, approver notes,
 * and the lock/unlock reason.
 *
 * @param escalations            - List of escalation objects from the AI review decision
 * @param reason                 - The reason string from the decision
 * @param showAuthor             - When true, appends "(by <handle>)" to each note.
 *                                 Pass false for reviewer role so author identity is hidden.
 *                                 Defaults to true.
 * @param resourceMemberIdMapping - Map of memberId → BackendResource used to resolve handles.
 * @param submissionLocked       - When true, labels the reason as "Locked Reason";
 *                                 otherwise labels it as "Unlock Reason".
 *
 * Returns undefined if there are no notes at all.
 */
function buildNotesTooltip(
    escalations?: AiReviewDecisionEscalation[],
    reason?: string | null,
    showAuthor: boolean = true,
    resourceMemberIdMapping: Record<string, BackendResource> = {},
    submissionLocked: boolean = false,
): string | undefined {
    const parts: string[] = []

    escalations?.forEach(esc => {
        if (esc.escalationNotes) {
            const handle = resolveHandle(esc.createdBy, resourceMemberIdMapping)
            const by = showAuthor && handle ? ` (by ${handle})` : ''
            parts.push(`Escalation Note${by}: ${esc.escalationNotes}`)
        }

        if (esc.approverNotes) {
            const handle = resolveHandle(esc.updatedBy, resourceMemberIdMapping)
            const by = showAuthor && handle ? ` (by ${handle})` : ''
            const prefix = esc.status === 'APPROVED'
                ? 'Approval Note'
                : esc.status === 'REJECTED'
                    ? 'Rejection Note'
                    : 'Approver Note'
            parts.push(`${prefix}${by}: ${esc.approverNotes}`)
        }
    })

    if (reason) {
        const reasonLabel: string = submissionLocked ? 'Locked Reason' : 'Unlock Reason'
        parts.push(`${reasonLabel}: ${reason}`)
    }

    return parts.length ? parts.join('\n') : undefined
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
    const resourceMemberIdMapping: ChallengeDetailContextModel['resourceMemberIdMapping']
        = challengeDetailContext.resourceMemberIdMapping

    const rolePermissions: UseRolePermissionsResult = useRolePermissions()
    const {
        hasSubmitterRole,
        isAdmin,
        hasCopilotRole,
        isProjectManager,
    }: UseRolePermissionsResult = rolePermissions

    /**
     * Only Copilot, Project Manager, and Admin can see WHO performed the action.
     * Reviewers can see the note TEXT but NOT the author "(by handle)".
     * Submitters cannot see notes at all.
     */
    const canSeeAuthor = isAdmin || hasCopilotRole || isProjectManager

    const aiReviewersCount = useMemo(() => {
        const reviewersCount = props.aiReviewers.length || aiReviewConfig?.workflows?.length || 0
        return reviewersCount + 1
    }, [aiReviewConfig?.workflows?.length, props.aiReviewers.length])

    const currentDecision = useMemo<AiReviewDecision | undefined>(
        () => aiReviewDecisionsBySubmissionId[props.submission.id],
        [aiReviewDecisionsBySubmissionId, props.submission.id],
    )

    // Extracted into its own memo to reduce the complexity count of the component arrow function
    const normalizedStatus = useMemo(
        () => normalizeDecisionStatus(currentDecision?.status),
        [currentDecision?.status],
    )

    /**
     * Builds the tooltip text for the notes icon shown next to the status label.
     *
     * - Submitters              → undefined (icon not shown at all)
     * - Reviewers               → note text only, NO "(by handle)"  (canSeeAuthor = false)
     * - Copilot / PM / Admin    → note text WITH "(by handle)"       (canSeeAuthor = true)
     */
    const notesTooltip = useMemo((): string | undefined => {
        if (hasSubmitterRole || !currentDecision) return undefined

        return buildNotesTooltip(
            currentDecision.escalations,
            currentDecision.reason,
            canSeeAuthor,
            resourceMemberIdMapping,
            currentDecision.submissionLocked,
        )
    }, [canSeeAuthor, currentDecision, hasSubmitterRole, resourceMemberIdMapping])

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
                            {/*
                             * Notes icon: visible to Reviewers, Copilot, PM, Admin.
                             * Hidden from Submitters entirely.
                             * Reviewers see note text only (no author handle).
                             * Copilot / PM / Admin see note text with "(by handle)".
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
