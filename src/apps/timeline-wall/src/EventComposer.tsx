/* User-uploaded videos have no caption tracks in the timeline API. */
/* eslint-disable jsx-a11y/media-has-caption */
/* Form handlers capture the current draft. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, FormEvent, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Modal } from 'react-responsive-modal'

import { ALLOWED_MEDIA_TYPES, dateKey, EventDraft } from './timeline-wall.models'
import { createEvent, errorMessage } from './timeline-wall.service'

const emptyDraft: EventDraft = { description: '', eventDate: '', files: [], title: '' }

interface Props {
    isAdmin: boolean
    onCreated: () => void
}

const EventComposer: FC<Props> = props => {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState<EventDraft>(emptyDraft)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [confirmed, setConfirmed] = useState(false)
    const [previews, setPreviews] = useState<string[]>([])
    const dropzone = useDropzone({
        accept: ALLOWED_MEDIA_TYPES,
        disabled: busy,
        maxFiles: 3,
        onDrop: (files, rejections) => {
            if (rejections.length || draft.files.length + files.length > 3) {
                setError('Upload up to 3 photos/videos (JPEG, PNG, MP4, AVI or WebM).')
                return
            }

            setError('')
            setDraft(previous => ({ ...previous,
                files: [...previous.files, ...files.filter(file => !previous.files.some(
                    existing => existing.name === file.name && existing.lastModified === file.lastModified,
                ))] }))
        },
    })

    useEffect(() => {
        const urls = draft.files.map(file => URL.createObjectURL(file))
        setPreviews(urls)
        return () => urls.forEach(url => URL.revokeObjectURL(url))
    }, [draft.files])

    async function submit(event: FormEvent): Promise<void> {
        event.preventDefault()
        setBusy(true)
        setError('')
        try {
            await createEvent(draft)
            setDraft(emptyDraft)
            setOpen(false)
            setConfirmed(true)
            props.onCreated()
        } catch (failure) {
            setError(errorMessage(failure))
        } finally {
            setBusy(false)
        }
    }

    function cancel(): void {
        setOpen(false)
        setDraft(emptyDraft)
        setError('')
    }

    return (
        <section className='timeline-composer' aria-label='Add an event'>
            {!open ? (
                <button className='timeline-add' type='button' onClick={() => setOpen(true)}>
                    <span>What event would you like to add?</span>
                    <span>Photo / Video</span>
                </button>
            ) : (
                <form onSubmit={submit}>
                    <h2>Add New Event</h2>
                    <fieldset disabled={busy}>
                        <div className='timeline-form-grid'>
                            <div>
                                <label htmlFor='timeline-title'>Event name</label>
                                <input
                                    id='timeline-title'
                                    required
                                    maxLength={38}
                                    value={draft.title}
                                    placeholder='Enter event title'
                                    onChange={event => setDraft({ ...draft, title: event.target.value })}
                                />
                                <small>{`${draft.title.length}/38`}</small>
                                <label htmlFor='timeline-date'>Event Date</label>
                                <input
                                    id='timeline-date'
                                    type='date'
                                    required
                                    value={draft.eventDate}
                                    max={dateKey(new Date())}
                                    onChange={event => setDraft({ ...draft, eventDate: event.target.value })}
                                />
                                <label htmlFor='timeline-description'>Description</label>
                                <textarea
                                    id='timeline-description'
                                    required
                                    maxLength={240}
                                    rows={4}
                                    placeholder='Tell your community about this memory'
                                    value={draft.description}
                                    onChange={event => setDraft({ ...draft, description: event.target.value })}
                                />
                                <small>{`${draft.description.length}/240`}</small>
                            </div>
                            <div>
                                <div {...dropzone.getRootProps({ className: 'timeline-dropzone' })}>
                                    <input {...dropzone.getInputProps({ 'aria-label': 'Upload photos or videos' })} />
                                    <p>Drag &amp; drop your photo or video here</p>
                                    <p>You can upload up to 3 photos/videos</p>
                                    <span className='timeline-outline'>Browse</span>
                                </div>
                                <ul className='timeline-uploads'>
                                    {draft.files.map((file, index) => (
                                        <li key={`${file.name}-${file.lastModified}`}>
                                            {file.type.startsWith('image/')
                                                ? <img src={previews[index]} alt={file.name} />
                                                : <video src={previews[index]} controls aria-label={file.name} />}
                                            <span>{file.name}</span>
                                            <button
                                                type='button'
                                                aria-label={`Remove ${file.name}`}
                                                onClick={() => setDraft({
                                                    ...draft,
                                                    files: draft.files.filter((_, i) => i !== index),
                                                })}
                                            >
                                                Remove
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        {error && <p role='alert' className='timeline-error'>{error}</p>}
                        <div className='timeline-actions'>
                            <button type='button' onClick={cancel}>Cancel</button>
                            <button
                                className='timeline-primary'
                                type='submit'
                                disabled={!draft.title.trim() || !draft.description.trim() || !draft.eventDate}
                            >
                                {busy ? 'Sharing event…' : 'Share event'}
                            </button>
                        </div>
                    </fieldset>
                </form>
            )}
            <Modal
                open={confirmed}
                onClose={() => setConfirmed(false)}
                center
                classNames={{ modal: 'timeline-modal' }}
                ariaLabelledby='timeline-confirm-title'
            >
                <h2 id='timeline-confirm-title'>Confirmation</h2>
                <p>
                    {props.isAdmin
                        ? 'Thank you! Your event was added to the Timeline Wall.'
                        : 'Thank you! Your event was submitted for review. '
                            + 'You’ll receive an email once the review is completed.'}
                </p>
                <button type='button' onClick={() => setConfirmed(false)}>OK</button>
            </Modal>
        </section>
    )
}

export default EventComposer
