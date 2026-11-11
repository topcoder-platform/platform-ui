import { EnvironmentConfig } from '~/config'
import { tokenGetAsync } from '~/libs/core'

import { EventDraft, TimelineEvent } from './timeline-wall.models'

const baseUrl = `${EnvironmentConfig.API.V5}/timeline-wall`

/** Keep public reads anonymous; obtain a fresh platform token for each protected operation. */
async function request<T>(path: string, authenticated: boolean = false, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers)
    if (authenticated) {
        const token = (await tokenGetAsync())?.token
        if (!token) throw new Error('Please sign in to continue.')
        headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(`${baseUrl}/${path}`, { ...options, headers })
    if (!response.ok) {
        const body = await response.json()
            .catch(() => ({}))
        throw new Error(body.message || `The request failed (${response.status}). Please try again.`)
    }

    const text = await response.text()
    return text ? JSON.parse(text) : undefined
}

export function getEvents(): Promise<TimelineEvent[]> {
    return request('timelineEvents')
}

export function getPendingEvents(): Promise<TimelineEvent[]> {
    return request('timelineEvents/review', true)
}

export function getCurrentUser(): Promise<{ isAdmin: boolean }> {
    return request('auth/currentUser', true)
}

export function createEvent(draft: EventDraft): Promise<void> {
    const body = new FormData()
    body.append('title', draft.title)
    body.append('description', draft.description)
    // The legacy date picker submitted local midnight, not UTC midnight.
    body.append('eventDate', new Date(`${draft.eventDate}T00:00:00`)
        .toISOString())
    draft.files.forEach(file => body.append('mediaFiles', file))
    return request('timelineEvents', true, { body, method: 'POST' })
}

export function approveEvent(id: number): Promise<void> {
    return request(`timelineEvents/${id}/approve`, true, { method: 'PUT' })
}

export function rejectEvent(id: number, reason: string, note: string): Promise<void> {
    return request(`timelineEvents/${id}/reject`, true, {
        body: JSON.stringify({ note, reason }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
    })
}

export function deleteEvent(id: number): Promise<void> {
    return request(`timelineEvents/${id}`, true, { method: 'DELETE' })
}

export async function getAvatar(handle: string): Promise<string> {
    const response = await fetch(`${EnvironmentConfig.API.V5}/members/${encodeURIComponent(handle)}`)
    if (!response.ok) return ''
    return (await response.json()).photoURL || ''
}

export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'The request failed. Please try again.'
}
