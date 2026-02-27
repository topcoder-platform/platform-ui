/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-array-index-key */
import {
    FC,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'
import moment from 'moment'

import { EnvironmentConfig } from '~/config'
import { IconOutline } from '~/libs/ui'

import { type TimelineEvent } from '../../../../lib/models'
import { ModalDeleteConfirmation } from '../ModalDeleteConfirmation'
import { ModalPhotoViewer } from '../ModalPhotoViewer'

import styles from './EventItem.module.scss'

const DEFAULT_AVATAR_URL
    = 'https://images.ctfassets.net/b5f1djy59z3a/4PTwZVSf3W7qgs9WssqbVa/'
        + '4c51312671a4b9acbdfd7f5e22320b62/default_avatar.svg'

interface EventItemProps {
    className?: string
    eventItem: TimelineEvent & { color?: 'green' | 'purple' | 'red' }
    idPrefix: string
    isAdmin: boolean
    isLeft?: boolean
    onDeleteEvent: (id: string) => Promise<void> | void
    userAvatars: Record<string, string>
}

/**
 * Renders one approved timeline event card.
 *
 * @param props Event details and moderation handlers.
 * @returns Timeline event card.
 */
const EventItem: FC<EventItemProps> = (props: EventItemProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false)
    const [showModalPhoto, setShowModalPhoto] = useState<boolean>(false)
    const [selectedPhoto, setSelectedPhoto] = useState<number>(0)
    const [showModalDelete, setShowModalDelete] = useState<boolean>(false)

    const photoUrl = useMemo(
        () => props.userAvatars[props.eventItem.createdBy] || DEFAULT_AVATAR_URL,
        [props.eventItem.createdBy, props.userAvatars],
    )

    const mediaFiles = props.eventItem.mediaFiles || []

    return (
        <div
            className={classNames(
                styles.container,
                props.className,
                props.eventItem.color === 'green' && styles.colorGreen,
                props.eventItem.color === 'purple' && styles.colorPurple,
                props.eventItem.color === 'red' && styles.colorRed,
            )}
            id={`${props.idPrefix}${moment(props.eventItem.eventDate)
                .format('YYYY-MM')}`}
        >
            {!props.isLeft && <div className={classNames(styles.dot, styles.dotLeft)} />}
            <div className={styles.content}>
                <button
                    className={styles.header}
                    onClick={() => setIsExpanded(previous => !previous)}
                    type='button'
                >
                    <span>{props.eventItem.title}</span>
                    <IconOutline.ChevronDownIcon
                        className={classNames(isExpanded && styles.flipVertical)}
                        width={18}
                    />
                </button>

                <button
                    className={classNames(styles.contentText, isExpanded && styles.expanded)}
                    onClick={() => setIsExpanded(previous => !previous)}
                    type='button'
                >
                    {props.eventItem.description}
                </button>

                {!!mediaFiles.length && (
                    <div
                        className={classNames(
                            styles.photoContainer,
                            mediaFiles.length === 1 && styles.onePhoto,
                            mediaFiles.length === 2 && styles.twoPhoto,
                        )}
                    >
                        {mediaFiles.map((mediaUrl, index) => (
                            <button
                                className={styles.photoButton}
                                key={`${props.eventItem.id}-${mediaUrl}-${index}`}
                                onClick={() => {
                                    setSelectedPhoto(index)
                                    setShowModalPhoto(true)
                                }}
                                type='button'
                            >
                                <img alt={`${props.eventItem.title} media ${index + 1}`} src={mediaUrl} />
                            </button>
                        ))}
                    </div>
                )}

                <div className={styles.bottom}>
                    <div className={styles.bottomLeft}>
                        <img alt='avatar' className={styles.avatar} src={photoUrl} />
                        <a
                            className={styles.handleLink}
                            href={`${EnvironmentConfig.TOPCODER_URL}/members/${props.eventItem.createdBy}`}
                            rel='noopener noreferrer'
                            target='_blank'
                        >
                            {props.eventItem.createdBy}
                        </a>
                        <span className={styles.dateLabel}>
                            {' • '}
                            {moment(props.eventItem.eventDate)
                                .format('MMM DD, YYYY')}
                        </span>
                    </div>
                    {props.isAdmin && (
                        <button
                            className={styles.deleteButton}
                            onClick={() => setShowModalDelete(true)}
                            type='button'
                        >
                            <IconOutline.TrashIcon width={17} />
                        </button>
                    )}
                </div>
            </div>
            {props.isLeft && <div className={classNames(styles.dot, styles.dotRight)} />}

            <ModalPhotoViewer
                onClose={() => setShowModalPhoto(false)}
                open={showModalPhoto}
                photos={mediaFiles}
                selectedPhoto={selectedPhoto}
            />

            <ModalDeleteConfirmation
                handle={props.eventItem.createdBy}
                id={props.eventItem.id}
                onClose={() => setShowModalDelete(false)}
                onDelete={props.onDeleteEvent}
                open={showModalDelete}
                title={props.eventItem.title}
            />
        </div>
    )
}

EventItem.defaultProps = {
    className: undefined,
    isLeft: false,
}

export default EventItem
