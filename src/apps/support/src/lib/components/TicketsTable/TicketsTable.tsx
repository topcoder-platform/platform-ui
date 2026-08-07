/* eslint-disable react/destructuring-assignment, react/jsx-no-bind */
/** Responsive ticket table and mobile cards. */
import { FC, KeyboardEvent, MouseEvent } from 'react'
import classNames from 'classnames'

import { Button, LinkButton } from '~/libs/ui'

import { SupportTicketSummary } from '../../models'
import {
    buildSupportChallengeUrl,
    formatSupportDate,
    markdownToPlainText,
    truncateText,
} from '../../utils'
import { MemberHandle } from '../MemberHandle'

import styles from './TicketsTable.module.scss'

export interface TicketsTableProps {
    currentUserId?: string
    isSupportTeam: boolean
    onAssign: (ticket: SupportTicketSummary) => void
    onOpen: (ticket: SupportTicketSummary) => void
    assigningTicketId?: string
    tickets: SupportTicketSummary[]
}

/**
 * Determines whether the current staff member is already assigned.
 *
 * @param ticket ticket summary.
 * @param currentUserId authenticated user ID.
 * @returns true when the assignee list contains the user.
 * @throws Does not throw.
 */
export function isTicketAssignedToUser(
    ticket: SupportTicketSummary,
    currentUserId: string | undefined,
): boolean {
    return Boolean(currentUserId && ticket.assignees.some(
        assignee => String(assignee.userId) === currentUserId,
    ))
}

/**
 * Renders assignee handles or an explicit unassigned label.
 *
 * @param ticket ticket summary.
 * @returns linked assignee handles.
 * @throws Does not throw.
 */
const Assignees = ({ ticket }: { ticket: SupportTicketSummary }): JSX.Element => {
    if (!ticket.assignees.length) {
        return <span className={styles.muted}>Unassigned</span>
    }

    return (
        <span className={styles.assignees}>
            {ticket.assignees.map(assignee => (
                <MemberHandle
                    color={assignee.handleColor}
                    handle={assignee.handle}
                    key={assignee.userId}
                />
            ))}
        </span>
    )
}

/**
 * Renders an accessible unread indicator that does not rely on color.
 *
 * @param ticket ticket summary.
 * @returns unread badge when required.
 * @throws Does not throw.
 */
const UnreadBadge = ({ ticket }: { ticket: SupportTicketSummary }): JSX.Element => (ticket.hasUnread
    ? (
        <span className={styles.unreadBadge}>
            <span aria-hidden='true'>●</span>
            {' '}
            Unread
        </span>
    )
    : <></>)

/**
 * Prevents an external challenge-link click from also opening the Support ticket row.
 *
 * @param event challenge-link click event bubbling through the ticket row.
 * @returns void.
 * @throws Does not throw.
 */
function stopTicketRowNavigation(event: MouseEvent): void {
    event.stopPropagation()
}

/**
 * Renders a public challenge link without exposing the opaque challenge identifier.
 *
 * @param ticket ticket whose optional challenge association should be rendered.
 * @returns link button or an em dash when the ticket has no challenge.
 * @throws Does not throw.
 */
const ChallengeLink = ({ ticket }: { ticket: SupportTicketSummary }): JSX.Element => {
    if (!ticket.challengeId) return <>—</>

    return (
        <LinkButton
            label='View challenge'
            onClick={stopTicketRowNavigation}
            rel='noreferrer noopener'
            secondary
            size='sm'
            target='_blank'
            to={buildSupportChallengeUrl(ticket.challengeId)}
        />
    )
}

/**
 * Renders responsive, keyboard-navigable ticket results.
 *
 * @param props tickets, viewer context, and row/action handlers.
 * @returns desktop table and mobile cards.
 * @throws Does not throw.
 */
export const TicketsTable: FC<TicketsTableProps> = props => {
    /**
     * Opens the focused row with Enter or Space.
     *
     * @param event keyboard event raised by the row or a child control.
     * @param ticket ticket represented by the focused row.
     * @returns void.
     * @throws Does not throw.
     */
    const handleKeyDown = (event: KeyboardEvent, ticket: SupportTicketSummary): void => {
        if (event.target !== event.currentTarget) {
            return
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            props.onOpen(ticket)
        }
    }

    /**
     * Stops row navigation before invoking the assignment action.
     *
     * @param event assignment-button mouse event.
     * @param ticket ticket that should be assigned.
     * @returns void.
     * @throws Does not throw.
     */
    const handleAssign = (event: MouseEvent, ticket: SupportTicketSummary): void => {
        event.stopPropagation()
        props.onAssign(ticket)
    }

    /**
     * Creates the bounded plain-text preview used by both responsive views.
     *
     * @param ticket ticket whose Markdown description should be summarized.
     * @returns a safe, bounded plain-text preview.
     * @throws Does not throw.
     */
    const preview = (ticket: SupportTicketSummary): string => truncateText(
        markdownToPlainText(ticket.description),
        150,
    )

    return (
        <div className={styles.wrapper}>
            <div className={styles.desktop}>
                <table>
                    <caption className={styles.srOnly}>Support tickets</caption>
                    <thead>
                        <tr>
                            <th scope='col'>Request</th>
                            {props.isSupportTeam && <th scope='col'>Member</th>}
                            <th scope='col'>Challenge</th>
                            <th scope='col'>Replies</th>
                            <th scope='col'>Assignees</th>
                            <th scope='col'>Last activity</th>
                            {props.isSupportTeam && <th scope='col'>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {props.tickets.map(ticket => {
                            const assigned = isTicketAssignedToUser(ticket, props.currentUserId)
                            return (
                                <tr
                                    aria-label={`${ticket.hasUnread ? 'Unread' : 'Read'} ticket: ${preview(ticket)}`}
                                    className={classNames(ticket.hasUnread && styles.unread)}
                                    key={ticket.id}
                                    onClick={() => props.onOpen(ticket)}
                                    onKeyDown={event => handleKeyDown(event, ticket)}
                                    tabIndex={0}
                                >
                                    <td>
                                        <UnreadBadge ticket={ticket} />
                                        <span>{preview(ticket)}</span>
                                    </td>
                                    {props.isSupportTeam && (
                                        <td>
                                            <MemberHandle
                                                color={ticket.memberHandleColor}
                                                handle={ticket.memberHandle}
                                            />
                                        </td>
                                    )}
                                    <td><ChallengeLink ticket={ticket} /></td>
                                    <td>{ticket.responseCount}</td>
                                    <td><Assignees ticket={ticket} /></td>
                                    <td>{formatSupportDate(ticket.latestActivityAt)}</td>
                                    {props.isSupportTeam && (
                                        <td>
                                            {ticket.status === 'OPEN' && (
                                                <Button
                                                    disabled={assigned || props.assigningTicketId === ticket.id}
                                                    label={assigned ? 'Assigned to you' : 'Assign to me'}
                                                    onClick={event => handleAssign(event, ticket)}
                                                    secondary
                                                    size='sm'
                                                />
                                            )}
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <div className={styles.mobile}>
                {props.tickets.map(ticket => {
                    const assigned = isTicketAssignedToUser(ticket, props.currentUserId)
                    return (
                        <article
                            className={classNames(styles.card, ticket.hasUnread && styles.unread)}
                            key={ticket.id}
                        >
                            <UnreadBadge ticket={ticket} />
                            <h2>{preview(ticket)}</h2>
                            {props.isSupportTeam && (
                                <p>
                                    <strong>Member:</strong>
                                    {' '}
                                    <MemberHandle
                                        color={ticket.memberHandleColor}
                                        handle={ticket.memberHandle}
                                    />
                                </p>
                            )}
                            <p>
                                <strong>Challenge:</strong>
                                {' '}
                                <ChallengeLink ticket={ticket} />
                            </p>
                            <p>
                                <strong>Replies:</strong>
                                {' '}
                                {ticket.responseCount}
                            </p>
                            <p>
                                <strong>Assignees:</strong>
                                {' '}
                                <Assignees ticket={ticket} />
                            </p>
                            <p>
                                <strong>Last activity:</strong>
                                {' '}
                                {formatSupportDate(ticket.latestActivityAt)}
                            </p>
                            <div className={styles.cardActions}>
                                <Button label='View details' onClick={() => props.onOpen(ticket)} primary size='sm' />
                                {props.isSupportTeam && ticket.status === 'OPEN' && (
                                    <Button
                                        disabled={assigned || props.assigningTicketId === ticket.id}
                                        label={assigned ? 'Assigned to you' : 'Assign to me'}
                                        onClick={event => handleAssign(event, ticket)}
                                        secondary
                                        size='sm'
                                    />
                                )}
                            </div>
                        </article>
                    )
                })}
            </div>
        </div>
    )
}
