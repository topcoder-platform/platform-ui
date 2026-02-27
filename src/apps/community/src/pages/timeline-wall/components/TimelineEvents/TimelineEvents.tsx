/* eslint-disable react/jsx-no-bind */
import {
    FC,
    useEffect,
    useState,
} from 'react'
import classNames from 'classnames'

import { type TimelineEvent } from '../../../../lib/models'
import { AddEventButton } from '../AddEventButton'
import { EventItem } from '../EventItem'
import { RightFilter } from '../RightFilter'

import styles from './TimelineEvents.module.scss'

interface TimelineFilterValue {
    month: number
    year: number
}

interface TimelineEventsProps {
    className?: string
    events: TimelineEvent[]
    isAdmin: boolean
    isAuthenticated: boolean
    onDeleteEvent: (id: string) => Promise<void> | void
    onDoneAddEvent: () => void
    onSubmitEvent: (formData: FormData) => Promise<void>
    selectedFilterValue: TimelineFilterValue
    setSelectedFilterValue: (value: TimelineFilterValue) => void
    setShowRightFilterMobile: (value: boolean) => void
    showRightFilterMobile: boolean
    uploadResult: string
    uploading: boolean
    userAvatars: Record<string, string>
}

const colors: Array<'green' | 'purple' | 'red'> = ['green', 'red', 'purple']

interface ColoredTimelineEvent extends TimelineEvent {
    color: 'green' | 'purple' | 'red'
}

/**
 * Timeline tab content containing add-event form, timeline cards, and date filters.
 *
 * @param props Timeline state and actions.
 * @returns Timeline events layout.
 */
const TimelineEvents: FC<TimelineEventsProps> = (props: TimelineEventsProps) => {
    const [leftItems, setLeftItems] = useState<ColoredTimelineEvent[]>([])
    const [rightItems, setRightItems] = useState<ColoredTimelineEvent[]>([])
    const [mobileItems, setMobileItems] = useState<ColoredTimelineEvent[]>([])

    useEffect(() => {
        let leftHeight = 135
        let rightHeight = 56

        const leftItemsBuffer: ColoredTimelineEvent[] = []
        const rightItemsBuffer: ColoredTimelineEvent[] = []
        const mobileItemsBuffer: ColoredTimelineEvent[] = []

        for (let index = 0; index < props.events.length; index += 1) {
            const event = props.events[index]
            const cellHeight = event.mediaFiles.length > 0 ? 291 : 155
            const coloredEvent: ColoredTimelineEvent = {
                ...event,
                color: colors[index % colors.length],
            }

            if (leftHeight <= rightHeight) {
                leftItemsBuffer.push(coloredEvent)
                leftHeight += cellHeight
            } else {
                rightItemsBuffer.push(coloredEvent)
                rightHeight += cellHeight
            }

            mobileItemsBuffer.push(coloredEvent)
        }

        setLeftItems(leftItemsBuffer)
        setRightItems(rightItemsBuffer)
        setMobileItems(mobileItemsBuffer)
    }, [props.events])

    return (
        <div className={classNames(styles.container, props.className)}>
            <div className={styles.leftContent}>
                <AddEventButton
                    isAdmin={props.isAdmin}
                    isAuthenticated={props.isAuthenticated}
                    onDoneAddEvent={props.onDoneAddEvent}
                    onSubmitEvent={props.onSubmitEvent}
                    uploadResult={props.uploadResult}
                    uploading={props.uploading}
                />

                {!!props.events.length && (
                    <div className={styles.eventsGrid}>
                        <div className={styles.reparator}>
                            <div className={styles.dot} />
                        </div>

                        <div className={classNames(styles.blockLeft, styles.desktopOnly)}>
                            {leftItems.map(item => (
                                <EventItem
                                    eventItem={item}
                                    idPrefix='desktop-'
                                    isAdmin={props.isAdmin}
                                    isLeft
                                    key={item.id}
                                    onDeleteEvent={props.onDeleteEvent}
                                    userAvatars={props.userAvatars}
                                />
                            ))}
                        </div>

                        <div className={classNames(styles.blockRight, styles.desktopOnly)}>
                            {rightItems.map(item => (
                                <EventItem
                                    eventItem={item}
                                    idPrefix='desktop-'
                                    isAdmin={props.isAdmin}
                                    key={item.id}
                                    onDeleteEvent={props.onDeleteEvent}
                                    userAvatars={props.userAvatars}
                                />
                            ))}
                        </div>

                        <div className={classNames(styles.blockMobile, styles.mobileOnly)}>
                            {mobileItems.map(item => (
                                <EventItem
                                    eventItem={item}
                                    idPrefix='mobile-'
                                    isAdmin={props.isAdmin}
                                    key={item.id}
                                    onDeleteEvent={props.onDeleteEvent}
                                    userAvatars={props.userAvatars}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {!props.events.length && (
                    <span className={styles.emptyState}>
                        No events have been added. Be the first who adds one.
                    </span>
                )}
            </div>

            <RightFilter
                className={classNames(
                    styles.rightFilter,
                    !props.showRightFilterMobile && styles.mobileHidden,
                )}
                events={props.events}
                selectedFilterValue={props.selectedFilterValue}
                setSelectedFilterValue={(newFilter: TimelineFilterValue) => {
                    props.setSelectedFilterValue(newFilter)
                    props.setShowRightFilterMobile(false)
                }}
            />
        </div>
    )
}

TimelineEvents.defaultProps = {
    className: undefined,
}

export default TimelineEvents
