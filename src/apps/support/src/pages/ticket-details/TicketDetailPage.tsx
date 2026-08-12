/* eslint-disable @typescript-eslint/typedef, react/jsx-no-bind */
/** Support ticket conversation and staff actions. */
import {
    FC,
    useEffect,
    useRef,
    useState,
} from 'react'
import {
    Link,
    useParams,
} from 'react-router-dom'
import useSWR from 'swr'

import { useProfileContext } from '~/libs/core'
import { BaseModal, Button } from '~/libs/ui'

import { buildSupportPath } from '../../config/routes.config'
import {
    MarkdownContent,
    MemberHandle,
    SupportError,
    SupportLoading,
    SupportMarkdownEditor,
} from '../../lib/components'
import { SupportTicketDetail } from '../../lib/models'
import {
    addSupportResponse,
    assignSupportTicketToMe,
    closeSupportTicket,
    getSupportTicket,
    markSupportTicketRead,
    unassignSupportTicketFromMe,
} from '../../lib/services'
import {
    buildSupportChallengeUrl,
    formatSupportDate,
    getSupportErrorMessage,
    isSupportTeamMember,
    sortResponsesAscending,
} from '../../lib/utils'

import styles from './TicketDetailPage.module.scss'

/**
 * Renders the original request followed by ascending replies and authorized actions.
 *
 * @returns support ticket detail page.
 * @throws Does not throw; request failures are shown with recovery actions.
 */
export const TicketDetailPage: FC = () => {
    const { ticketId } = useParams<{ ticketId: string }>()
    const { profile } = useProfileContext()
    const supportTeam = isSupportTeamMember(profile?.roles)
    const currentUserId = profile?.userId === undefined ? undefined : String(profile.userId)
    const markedReadTicket = useRef<string | undefined>()
    const [reply, setReply] = useState('')
    const [replyError, setReplyError] = useState<string | undefined>()
    const [actionError, setActionError] = useState<string | undefined>()
    const [actionMessage, setActionMessage] = useState<string | undefined>()
    const [submittingReply, setSubmittingReply] = useState(false)
    const [updatingAssignment, setUpdatingAssignment] = useState(false)
    const [closing, setClosing] = useState(false)
    const [confirmClose, setConfirmClose] = useState(false)
    const [replyRevision, setReplyRevision] = useState(0)
    const requestKey = ticketId ? `support-ticket:${ticketId}` : undefined
    const { data, error, isValidating, mutate } = useSWR<SupportTicketDetail>(
        requestKey,
        () => getSupportTicket(ticketId as string),
        { revalidateOnFocus: true, shouldRetryOnError: false },
    )

    useEffect(() => {
        if (!data || markedReadTicket.current === data.id) return

        markedReadTicket.current = data.id
        markSupportTicketRead(data.id)
            .then(() => mutate(current => (current
                ? { ...current, hasUnread: false }
                : current), false))
            .catch(() => undefined)
    }, [data, mutate])

    if (!ticketId) {
        return (
            <SupportError
                message='This support ticket could not be found.'
                onRetry={() => window.location.assign(buildSupportPath())}
            />
        )
    }

    if (!data && isValidating) return <SupportLoading />
    if (!data && error) {
        return (
            <SupportError
                message={getSupportErrorMessage(error, 'The support ticket could not be loaded.')}
                onRetry={() => mutate()}
            />
        )
    }

    if (!data) return <SupportLoading />

    const assignedToCurrentUser = Boolean(currentUserId && data.assignees.some(
        assignee => String(assignee.userId) === currentUserId,
    ))
    const closed = data.status === 'CLOSED'
    const ticketOwner = Boolean(currentUserId && String(data.memberUserId) === currentUserId)
    const canReply = !closed || ticketOwner
    const replyContext = `${data.id}-reply-${replyRevision}`

    /**
     * Adds or removes the authenticated staff assignment and refreshes detail.
     *
     * @returns a promise resolved after the assignment request settles.
     * @throws Does not throw; request failures are stored for display.
     */
    const handleAssignment = async (): Promise<void> => {
        setUpdatingAssignment(true)
        setActionError(undefined)
        try {
            if (assignedToCurrentUser) {
                await unassignSupportTicketFromMe(data.id)
                setActionMessage('You are no longer assigned to this ticket.')
            } else {
                await assignSupportTicketToMe(data.id)
                setActionMessage('This ticket is now assigned to you.')
            }

            await mutate()
        } catch (assignmentError) {
            setActionError(getSupportErrorMessage(assignmentError, 'The assignment could not be updated.'))
        } finally {
            setUpdatingAssignment(false)
        }
    }

    /**
     * Validates and submits Markdown, including an owner response that reopens a closed ticket.
     *
     * @returns a promise resolved after validation or the reply request settles.
     * @throws Does not throw; request failures are stored for display.
     */
    const handleReply = async (): Promise<void> => {
        const markdown = reply.trim()
        if (!markdown) {
            setReplyError('Enter a reply before sending.')
            return
        }

        setSubmittingReply(true)
        setActionError(undefined)
        try {
            const updatedTicket = await addSupportResponse(data.id, { markdown })
            setReply('')
            setReplyRevision(current => current + 1)
            setReplyError(undefined)
            setActionMessage(closed
                ? 'Your reply was added and the support ticket was reopened.'
                : 'Your reply was added.')
            await mutate(updatedTicket, false)
        } catch (responseError) {
            setActionError(getSupportErrorMessage(responseError, 'The reply could not be added.'))
        } finally {
            setSubmittingReply(false)
        }
    }

    /**
     * Confirms closure, refreshes the ticket, and reports the result.
     *
     * @returns a promise resolved after the close request settles.
     * @throws Does not throw; request failures are stored for display.
     */
    const handleCloseTicket = async (): Promise<void> => {
        setClosing(true)
        setActionError(undefined)
        try {
            await closeSupportTicket(data.id)
            setConfirmClose(false)
            setActionMessage('The support ticket was closed.')
            await mutate()
        } catch (closeError) {
            setActionError(getSupportErrorMessage(closeError, 'The ticket could not be closed.'))
        } finally {
            setClosing(false)
        }
    }

    return (
        <section className={styles.page}>
            <Link className={styles.back} to={closed ? buildSupportPath('closed') : buildSupportPath()}>
                ← Back to
                {' '}
                {closed ? 'closed' : 'open'}
                {' '}
                tickets
            </Link>
            <header className={styles.header}>
                <div>
                    <div className={styles.titleLine}>
                        <h1>Support request</h1>
                        <span className={closed ? styles.closed : styles.open}>{closed ? 'Closed' : 'Open'}</span>
                    </div>
                    <p>
                        Opened
                        {' '}
                        {formatSupportDate(data.openedAt)}
                        {' '}
                        by
                        {' '}
                        <MemberHandle
                            color={data.memberHandleColor}
                            handle={data.memberHandle}
                        />
                    </p>
                    {data.challengeId && (
                        <p>
                            Challenge:
                            {' '}
                            <a
                                className={styles.challengeLink}
                                href={buildSupportChallengeUrl(data.challengeId)}
                                rel='noreferrer noopener'
                                target='_blank'
                            >
                                View challenge
                            </a>
                        </p>
                    )}
                    {closed && (
                        <p>
                            Closed
                            {' '}
                            {formatSupportDate(data.closedAt)}
                        </p>
                    )}
                </div>
                {supportTeam && !closed && (
                    <div className={styles.headerActions}>
                        <Button
                            disabled={updatingAssignment}
                            label={assignedToCurrentUser ? 'Unassign me' : 'Assign to me'}
                            onClick={handleAssignment}
                            secondary
                            size='md'
                        />
                        <Button
                            label='Close support ticket'
                            onClick={() => setConfirmClose(true)}
                            primary
                            size='md'
                            variant='danger'
                        />
                    </div>
                )}
            </header>

            {actionMessage && <p aria-live='polite' className={styles.success}>{actionMessage}</p>}
            {actionError && <p className={styles.error} role='alert'>{actionError}</p>}

            <section aria-label='Assignees' className={styles.assigneePanel}>
                <strong>Assigned support staff</strong>
                <div>
                    {data.assignees.length
                        ? data.assignees.map(assignee => (
                            <MemberHandle
                                color={assignee.handleColor}
                                handle={assignee.handle}
                                key={assignee.userId}
                            />
                        ))
                        : <span>Unassigned</span>}
                </div>
            </section>

            <ol aria-label='Ticket conversation' className={styles.timeline}>
                <li>
                    <article className={styles.message}>
                        <header>
                            <strong>Original request</strong>
                            <span><MemberHandle color={data.memberHandleColor} handle={data.memberHandle} /></span>
                            <time dateTime={data.openedAt}>{formatSupportDate(data.openedAt)}</time>
                        </header>
                        <MarkdownContent markdown={data.description} />
                    </article>
                </li>
                {sortResponsesAscending(data.responses)
                    .map(response => (
                        <li key={response.id}>
                            <article className={styles.message}>
                                <header>
                                    <strong>Reply</strong>
                                    <span>
                                        <MemberHandle
                                            color={response.userHandleColor}
                                            handle={response.userHandle}
                                        />
                                    </span>
                                    <time dateTime={response.createdAt}>{formatSupportDate(response.createdAt)}</time>
                                </header>
                                <MarkdownContent markdown={response.markdown} />
                            </article>
                        </li>
                    ))}
            </ol>

            {canReply ? (
                <section className={styles.replyPanel}>
                    <h2>Add a reply</h2>
                    <SupportMarkdownEditor
                        contextId={replyContext}
                        disabled={submittingReply}
                        error={replyError}
                        key={replyContext}
                        label='Reply'
                        onChange={value => {
                            setReply(value)
                            if (value.trim()) setReplyError(undefined)
                        }}
                        uploadCategory='support-ticket-response'
                        value={reply}
                    />
                    <div className={styles.replyActions}>
                        <Button
                            disabled={submittingReply}
                            label={submittingReply ? 'Sending…' : 'Send reply'}
                            loading={submittingReply}
                            onClick={handleReply}
                            primary
                            size='lg'
                        />
                    </div>
                </section>
            ) : (
                <p className={styles.closedNotice}>This ticket is closed and cannot receive more replies.</p>
            )}

            <BaseModal
                center
                onClose={() => !closing && setConfirmClose(false)}
                open={confirmClose}
                size='sm'
                theme='danger'
                title='Close support ticket?'
                buttons={(
                    <>
                        <Button
                            disabled={closing}
                            label='Cancel'
                            onClick={() => setConfirmClose(false)}
                            secondary
                            size='md'
                        />
                        <Button
                            disabled={closing}
                            label={closing ? 'Closing…' : 'Close ticket'}
                            loading={closing}
                            onClick={handleCloseTicket}
                            primary
                            size='md'
                            variant='danger'
                        />
                    </>
                )}
            >
                <p>Members will be notified that this issue has been resolved.</p>
            </BaseModal>
        </section>
    )
}
