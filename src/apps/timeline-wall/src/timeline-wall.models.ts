export interface TimelineMedia {
    url: string
    previewUrl?: string
    isVideo?: boolean
}

export interface TimelineEvent {
    id: number
    title: string
    description: string
    eventDate: string
    createdDate: string
    createdBy: string
    mediaFiles: TimelineMedia[]
}

export interface EventDraft {
    title: string
    description: string
    eventDate: string
    files: File[]
}

export const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'video/mp4', 'video/x-msvideo', 'video/webm']
export const REJECTION_REASONS = ['Duplicate Event', 'Violates the Topcoder terms', 'Inaccurate or Invalid']
export const DISCUSS_URL = 'https://discussions.topcoder.com/discussion/24281/'
    + 'add-your-memory-to-the-topcoder-timeline-wall'

/** Legacy responses identify video by URL rather than an explicit media type. */
export function isVideo(media: TimelineMedia): boolean {
    return media.isVideo === true || /\.(mp4|avi|webm)(?:[?#]|$)/i.test(media.url)
}

/** Use local calendar dates consistently for form values and timeline navigation. */
export function dateKey(value: string | Date): string {
    const date = new Date(value)
    return `${date.getFullYear()}-${String(date.getMonth() + 1)
        .padStart(2, '0')}-${String(date.getDate())
        .padStart(2, '0')}`
}

export function formatDate(value: string): string {
    return new Date(value)
        .toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}
