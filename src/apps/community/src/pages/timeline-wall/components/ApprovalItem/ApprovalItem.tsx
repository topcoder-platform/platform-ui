/* eslint-disable no-void */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-array-index-key */
import {
    FC,
    useMemo,
    useState,
} from 'react'
import moment from 'moment'

import { EnvironmentConfig } from '~/config'
import { IconOutline } from '~/libs/ui'

import { type TimelineEvent } from '../../../../lib/models'
import { type RejectTimelineEventBody } from '../../../../lib/services'
import { ModalConfirmReject } from '../ModalConfirmReject'
import { ModalDeleteConfirmation } from '../ModalDeleteConfirmation'
import { ModalPhotoViewer } from '../ModalPhotoViewer'

import styles from './ApprovalItem.module.scss'

const DEFAULT_AVATAR_URL
    = 'https://images.ctfassets.net/b5f1djy59z3a/4PTwZVSf3W7qgs9WssqbVa/'
        + '4c51312671a4b9acbdfd7f5e22320b62/default_avatar.svg'

interface ApprovalItemProps {
    event: TimelineEvent
    onApproveEvent: (id: string) => Promise<void> | void
    onDeleteEvent: (id: string) => Promise<void> | void
    onRejectEvent: (
        id: string,
        body: RejectTimelineEventBody,
    ) => Promise<void> | void
    userAvatars: Record<string, string>
}

/**
 * Displays one pending approval entry for admin moderation.
 *
 * @param props Pending event details and action handlers.
 * @returns Pending approval card.
 */
const ApprovalItem: FC<ApprovalItemProps> = (props: ApprovalItemProps) => {
    const [showRejectModal, setShowRejectModal] = useState<boolean>(false)
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
    const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false)
    const [selectedPhoto, setSelectedPhoto] = useState<number>(0)

    const photoUrl = useMemo(
        () => props.userAvatars[props.event.createdBy] || DEFAULT_AVATAR_URL,
        [props.event.createdBy, props.userAvatars],
    )

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.metaLeft}>
                    <span className={styles.dateLabel}>
                        {moment(props.event.eventDate)
                            .format('MMM DD, YYYY')}
                    </span>
                    <img alt='avatar' className={styles.avatar} src={photoUrl} />
                    <a
                        className={styles.handleLink}
                        href={`${EnvironmentConfig.TOPCODER_URL}/members/${props.event.createdBy}`}
                        rel='noopener noreferrer'
                        target='_blank'
                    >
                        {props.event.createdBy}
                    </a>
                </div>
            </div>

            <h4 className={styles.title}>{props.event.title}</h4>
            <p className={styles.description}>{props.event.description}</p>

            {!!props.event.mediaFiles.length && (
                <div className={styles.photoContainer}>
                    {props.event.mediaFiles.map((mediaUrl, index) => (
                        <button
                            className={styles.photoButton}
                            key={`${props.event.id}-${mediaUrl}-${index}`}
                            onClick={() => {
                                setSelectedPhoto(index)
                                setShowPhotoModal(true)
                            }}
                            type='button'
                        >
                            <img alt={`${props.event.title} media ${index + 1}`} src={mediaUrl} />
                        </button>
                    ))}
                </div>
            )}

            <div className={styles.actions}>
                <button
                    className={styles.trashButton}
                    onClick={() => setShowDeleteModal(true)}
                    type='button'
                >
                    <IconOutline.TrashIcon width={18} />
                </button>
                <div className={styles.actionButtons}>
                    <button
                        className={styles.rejectButton}
                        onClick={() => setShowRejectModal(true)}
                        type='button'
                    >
                        Reject
                    </button>
                    <button
                        className={styles.approveButton}
                        onClick={() => {
                            void props.onApproveEvent(props.event.id)
                        }}
                        type='button'
                    >
                        Approve
                    </button>
                </div>
            </div>

            <ModalConfirmReject
                onClose={() => setShowRejectModal(false)}
                onReject={(body: RejectTimelineEventBody) => {
                    void props.onRejectEvent(props.event.id, body)
                }}
                open={showRejectModal}
            />

            <ModalDeleteConfirmation
                handle={props.event.createdBy}
                id={props.event.id}
                onClose={() => setShowDeleteModal(false)}
                onDelete={props.onDeleteEvent}
                open={showDeleteModal}
                title={props.event.title}
            />

            <ModalPhotoViewer
                onClose={() => setShowPhotoModal(false)}
                open={showPhotoModal}
                photos={props.event.mediaFiles}
                selectedPhoto={selectedPhoto}
            />
        </div>
    )
}

export default ApprovalItem
