/* User-uploaded videos have no caption tracks in the timeline API. */
/* eslint-disable jsx-a11y/media-has-caption */
/* Each media and moderation button captures its event or media index. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, useCallback, useEffect, useState } from 'react'
import { Modal } from 'react-responsive-modal'

import { EnvironmentConfig } from '~/config'

import { formatDate, isVideo, REJECTION_REASONS, TimelineEvent } from './timeline-wall.models'
import { approveEvent, deleteEvent, errorMessage, rejectEvent } from './timeline-wall.service'

interface Props {
    event: TimelineEvent
    avatar?: string
    isAdmin: boolean
    pending: boolean
    onChanged: () => void
}

const EventCard: FC<Props> = props => {
    const [expanded, setExpanded] = useState(false)
    const [mediaIndex, setMediaIndex] = useState<number>()
    const [action, setAction] = useState<'delete' | 'reject'>()
    const [reason, setReason] = useState('')
    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const event = props.event
    const media = mediaIndex === undefined ? undefined : event.mediaFiles[mediaIndex]

    const moveMedia = useCallback((delta: number): void => {
        setMediaIndex(previous => ((previous ?? 0) + delta + event.mediaFiles.length) % event.mediaFiles.length)
    }, [event.mediaFiles.length])

    useEffect(() => {
        if (mediaIndex === undefined) return undefined
        function keydown(key: KeyboardEvent): void {
            if (key.key === 'ArrowLeft') moveMedia(-1)
            if (key.key === 'ArrowRight') moveMedia(1)
        }

        window.addEventListener('keydown', keydown)
        return () => window.removeEventListener('keydown', keydown)
    }, [mediaIndex, moveMedia])

    async function moderate(operation: () => Promise<void>): Promise<void> {
        setBusy(true)
        setError('')
        try {
            await operation()
            setAction(undefined)
            props.onChanged()
        } catch (failure) {
            setError(errorMessage(failure))
        } finally {
            setBusy(false)
        }
    }

    return (
        <article className={`timeline-card ${props.pending ? 'timeline-pending-card' : ''}`} id={`event-${event.id}`}>
            <button
                className='timeline-card-title'
                type='button'
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
            >
                <h2>{event.title}</h2>
                <span aria-hidden>{expanded ? '−' : '+'}</span>
            </button>
            <p className={!expanded && !props.pending ? 'timeline-collapsed' : ''}>{event.description}</p>
            {!!event.mediaFiles.length && (
                <div className='timeline-media-strip'>
                    {event.mediaFiles.map((item, index) => (
                        <button
                            key={item.url}
                            type='button'
                            onClick={() => setMediaIndex(index)}
                            aria-label={`View ${isVideo(item) ? 'video' : 'photo'} ${index + 1} for ${event.title}`}
                        >
                            {isVideo(item) && !item.previewUrl
                                ? <video src={item.url} preload='metadata' muted aria-label='Video preview' />
                                : <img src={item.previewUrl || item.url} alt='' loading='lazy' />}
                            {isVideo(item) && <span className='timeline-play' aria-hidden>▶</span>}
                        </button>
                    ))}
                </div>
            )}
            <footer>
                {props.avatar ? <img className='timeline-avatar' src={props.avatar} alt='' />
                    : <span className='timeline-avatar' aria-hidden>{event.createdBy.slice(0, 1)}</span>}
                <a href={`${EnvironmentConfig.USER_PROFILE_URL}/${encodeURIComponent(event.createdBy)}`}>
                    {event.createdBy}
                </a>
                <time dateTime={event.eventDate}>{formatDate(event.eventDate)}</time>
            </footer>
            {props.pending && (
                <p className='timeline-submitted'>{`Submitted date: ${formatDate(event.createdDate)}`}</p>
            )}
            {props.isAdmin && (
                <div className='timeline-actions'>
                    <button type='button' disabled={busy} onClick={() => { setError(''); setAction('delete') }}>
                        Delete
                    </button>
                    {props.pending && (
                        <>
                            <button type='button' disabled={busy} onClick={() => { setError(''); setAction('reject') }}>
                                Reject
                            </button>
                            <button
                                type='button'
                                className='timeline-primary'
                                disabled={busy}
                                onClick={() => moderate(() => approveEvent(event.id))}
                            >
                                Approve
                            </button>
                        </>
                    )}
                </div>
            )}
            {error && !action && <p role='alert' className='timeline-error'>{error}</p>}
            <Modal
                open={!!media}
                onClose={() => setMediaIndex(undefined)}
                center
                classNames={{ modal: 'timeline-modal timeline-viewer' }}
                ariaLabelledby={`media-title-${event.id}`}
            >
                <h2 id={`media-title-${event.id}`}>{event.title}</h2>
                {media && (isVideo(media)
                    ? <video key={media.url} src={media.url} controls autoPlay aria-label={event.title} />
                    : <img src={media.url} alt={event.title} />)}
                <div className='timeline-actions'>
                    <button type='button' onClick={() => moveMedia(-1)} disabled={event.mediaFiles.length < 2}>
                        Previous
                    </button>
                    <span>{`${(mediaIndex ?? 0) + 1} / ${event.mediaFiles.length}`}</span>
                    <button type='button' onClick={() => moveMedia(1)} disabled={event.mediaFiles.length < 2}>
                        Next
                    </button>
                </div>
            </Modal>
            {action && (
                <Modal
                    open
                    onClose={() => { if (!busy) setAction(undefined) }}
                    center
                    classNames={{ modal: 'timeline-modal' }}
                    ariaLabelledby={`moderation-title-${event.id}`}
                >
                    <h2 id={`moderation-title-${event.id}`}>
                        {action === 'reject' ? 'Confirm Reject Event' : 'Delete Event'}
                    </h2>
                    <p>{`Are you sure you want to ${action} “${event.title}” by ${event.createdBy}?`}</p>
                    <p>This action cannot be undone.</p>
                    {action === 'reject' && (
                        <>
                            <label htmlFor={`reason-${event.id}`}>Rejection Reason</label>
                            <select
                                id={`reason-${event.id}`}
                                value={reason}
                                disabled={busy}
                                onChange={change => setReason(change.target.value)}
                            >
                                <option value=''>Select a reason</option>
                                {REJECTION_REASONS.map(value => <option key={value}>{value}</option>)}
                            </select>
                            <label htmlFor={`note-${event.id}`}>Note</label>
                            <textarea
                                id={`note-${event.id}`}
                                value={note}
                                maxLength={500}
                                rows={4}
                                disabled={busy}
                                onChange={change => setNote(change.target.value)}
                            />
                        </>
                    )}
                    {error && <p role='alert' className='timeline-error'>{error}</p>}
                    <div className='timeline-actions'>
                        <button type='button' disabled={busy} onClick={() => setAction(undefined)}>Cancel</button>
                        <button
                            type='button'
                            className='timeline-primary'
                            disabled={busy || (action === 'reject' && (!reason || !note.trim()))}
                            onClick={() => moderate(() => (action === 'delete'
                                ? deleteEvent(event.id) : rejectEvent(event.id, reason, note)))}
                        >
                            {busy ? 'Saving…' : action === 'delete' ? 'Delete' : 'Reject'}
                        </button>
                    </div>
                </Modal>
            )}
        </article>
    )
}

export default EventCard
