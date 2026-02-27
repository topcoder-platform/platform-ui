/**
 * Raw timeline event response from backend.
 */
export type TimelineEventStatus = 'approved' | 'pending' | 'rejected'

export interface BackendTimelineEvent {
    approvedAt?: string
    createdBy: string
    description: string
    eventDate: string
    id: string
    mediaFiles: string[]
    rejectionReason?: string
    status: TimelineEventStatus
    title: string
}

/**
 * Timeline event model used by the community app.
 */
export interface TimelineEvent {
    approvedAt?: string
    createdBy: string
    description: string
    eventDate: string
    id: string
    mediaFiles: string[]
    rejectionReason?: string
    status: TimelineEventStatus
    title: string
}

/**
 * Converts raw timeline event data into the frontend timeline model.
 *
 * @param data Raw timeline event.
 * @returns Converted timeline event.
 */
export function convertBackendTimelineEvent(
    data: BackendTimelineEvent,
): TimelineEvent {
    return {
        approvedAt: data.approvedAt,
        createdBy: data.createdBy,
        description: data.description,
        eventDate: data.eventDate,
        id: data.id,
        mediaFiles: data.mediaFiles,
        rejectionReason: data.rejectionReason,
        status: data.status,
        title: data.title,
    }
}
