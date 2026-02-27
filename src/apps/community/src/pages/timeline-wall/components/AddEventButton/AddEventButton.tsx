/* eslint-disable no-void */
/* eslint-disable react/jsx-no-bind */
import {
    ChangeEvent,
    Dispatch,
    FC,
    SetStateAction,
    useMemo,
    useState,
} from 'react'

import {
    IconOutline,
    InputFilePicker,
} from '~/libs/ui'

import { ModalEventAdd } from '../ModalEventAdd'

import styles from './AddEventButton.module.scss'

interface AddEventButtonProps {
    isAdmin: boolean
    isAuthenticated: boolean
    onDoneAddEvent: () => void
    onSubmitEvent: (formData: FormData) => Promise<void>
    uploadResult: string
    uploading: boolean
}

interface AddEventFormValues {
    date: string
    description: string
    eventName: string
    files: File[]
}

const defaultFormValues: AddEventFormValues = {
    date: '',
    description: '',
    eventName: '',
    files: [],
}

/**
 * Entry component for creating a new timeline event submission.
 *
 * @param props Event submission permissions and callbacks.
 * @returns Add event panel and input form.
 */
const AddEventButton: FC<AddEventButtonProps> = (props: AddEventButtonProps) => {
    const [formData, setFormData]: [
        AddEventFormValues,
        Dispatch<SetStateAction<AddEventFormValues>>
    ] = useState<AddEventFormValues>(defaultFormValues)
    const [showAddForm, setShowAddForm] = useState<boolean>(false)
    const [showResultModal, setShowResultModal] = useState<boolean>(false)

    const canSubmitForm = useMemo(
        () => Boolean(formData.eventName.trim())
            && Boolean(formData.date)
            && Boolean(formData.description.trim()),
        [formData.date, formData.description, formData.eventName],
    )

    function setFieldValue<K extends keyof AddEventFormValues>(
        key: K,
        value: AddEventFormValues[K],
    ): void {
        setFormData(previous => ({
            ...previous,
            [key]: value,
        }))
    }

    function submitEvent(): void {
        const payload = new FormData()

        payload.append('title', formData.eventName.trim())
        payload.append('description', formData.description.trim())
        payload.append('eventDate', formData.date)
        formData.files.forEach(file => {
            payload.append('mediaFiles', file)
        })

        setShowResultModal(true)
        setShowAddForm(false)
        setFormData(defaultFormValues)

        void props.onSubmitEvent(payload)
    }

    return (
        <div className={styles.container}>
            {!props.isAuthenticated && (
                <div className={styles.noLogin}>
                    Please login or create an account to add an event.
                </div>
            )}

            {props.isAuthenticated && !showAddForm && (
                <button
                    className={styles.addTriggerButton}
                    onClick={() => setShowAddForm(true)}
                    type='button'
                >
                    <span className={styles.addTriggerText}>What event would you like to add?</span>
                    <div className={styles.iconsWrap}>
                        <span className={styles.iconItem}>
                            <IconOutline.PhotographIcon width={18} />
                            <span>Photo</span>
                        </span>
                        <span className={styles.separator} />
                        <span className={styles.iconItem}>
                            <IconOutline.VideoCameraIcon width={18} />
                            <span>Video</span>
                        </span>
                    </div>
                </button>
            )}

            {props.isAuthenticated && showAddForm && (
                <div className={styles.addEventForm}>
                    <div className={styles.header}>
                        <span>Add New Event</span>
                        <button
                            className={styles.closeButton}
                            onClick={() => {
                                setFormData(defaultFormValues)
                                setShowAddForm(false)
                            }}
                            type='button'
                        >
                            ✕
                        </button>
                    </div>

                    <div className={styles.formFields}>
                        <label className={styles.label} htmlFor='timeline-event-name'>
                            Event Name
                        </label>
                        <input
                            className={styles.input}
                            id='timeline-event-name'
                            maxLength={38}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                setFieldValue('eventName', event.target.value)
                            }}
                            placeholder='Enter event title'
                            type='text'
                            value={formData.eventName}
                        />

                        <label className={styles.label} htmlFor='timeline-event-date'>
                            Event Date
                        </label>
                        <input
                            className={styles.input}
                            id='timeline-event-date'
                            max={new Date()
                                .toISOString()
                                .slice(0, 10)}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                setFieldValue('date', event.target.value)
                            }}
                            type='date'
                            value={formData.date}
                        />

                        <label className={styles.label} htmlFor='timeline-event-description'>
                            Description
                        </label>
                        <textarea
                            className={styles.textArea}
                            id='timeline-event-description'
                            maxLength={240}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                                setFieldValue('description', event.target.value)
                            }}
                            placeholder='Tell your community about this memory'
                            rows={5}
                            value={formData.description}
                        />

                        <div className={styles.filePickerWrap}>
                            <span className={styles.label}>Media File</span>
                            <InputFilePicker
                                fileConfig={{
                                    acceptFileType: 'image/*,video/*',
                                }}
                                name='timeline-event-file'
                                onChange={(fileList: FileList | undefined) => {
                                    setFieldValue(
                                        'files',
                                        fileList ? Array.from(fileList)
                                            .slice(0, 3) : [],
                                    )
                                }}
                            />
                            <p className={styles.fileHelpText}>
                                Drag and drop support is unavailable here. Use browse to attach up to 3 photos/videos.
                            </p>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button
                            className={styles.cancelButton}
                            onClick={() => {
                                setFormData(defaultFormValues)
                                setShowAddForm(false)
                            }}
                            type='button'
                        >
                            Cancel
                        </button>
                        <button
                            className={styles.submitButton}
                            disabled={!canSubmitForm}
                            onClick={submitEvent}
                            type='button'
                        >
                            Share Event
                        </button>
                    </div>
                </div>
            )}

            <ModalEventAdd
                isAdmin={props.isAdmin}
                onClose={() => {
                    setShowResultModal(false)
                    if (props.isAdmin) {
                        props.onDoneAddEvent()
                    }
                }}
                open={showResultModal}
                uploadResult={props.uploadResult}
                uploading={props.uploading}
            />
        </div>
    )
}

export default AddEventButton
