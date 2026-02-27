import axios, { AxiosResponse } from 'axios'

import { EnvironmentConfig } from '~/config'

import {
    type BackendTimelineEvent,
    convertBackendTimelineEvent,
    type TimelineEvent,
} from '../models'

const DEFAULT_AVATAR_URL
    = 'https://images.ctfassets.net/b5f1djy59z3a/4PTwZVSf3W7qgs9WssqbVa/'
        + '4c51312671a4b9acbdfd7f5e22320b62/default_avatar.svg'

const timelineWallInstance = axios.create({
    baseURL: EnvironmentConfig.TIMELINE_WALL_API,
})

interface TimelineCurrentUserResponse {
    isAdmin: boolean
}

interface BackendMemberResponse {
    photoURL?: string
}

export interface RejectTimelineEventBody {
    note?: string
    reason: string
}

export interface MemberAvatar {
    handle: string
    photoURL: string
}

function getAuthHeaders(token: string): Record<string, string> {
    return {
        Authorization: `Bearer ${token}`,
    }
}

/**
 * Fetches all approved timeline events.
 *
 * @returns Converted timeline events sorted by backend defaults.
 * @throws AxiosError When the timeline wall API request fails.
 */
export async function getTimelineEvents(): Promise<TimelineEvent[]> {
    const response = await timelineWallInstance.get<BackendTimelineEvent[]>('/timelineEvents')

    return response.data.map(convertBackendTimelineEvent)
}

/**
 * Fetches timeline events that require admin review.
 *
 * @param tokenV3 User auth token.
 * @returns Converted pending timeline events.
 * @throws AxiosError When the request is unauthorized or fails.
 */
export async function getPendingApprovals(
    tokenV3: string,
): Promise<TimelineEvent[]> {
    const response = await timelineWallInstance.get<BackendTimelineEvent[]>('/timelineEvents/review', {
        headers: getAuthHeaders(tokenV3),
    })

    return response.data.map(convertBackendTimelineEvent)
}

/**
 * Fetches the currently authenticated timeline user.
 *
 * @param tokenV3 User auth token.
 * @returns Current user role flags.
 * @throws AxiosError When the request is unauthorized or fails.
 */
export async function getCurrentUser(
    tokenV3: string,
): Promise<TimelineCurrentUserResponse> {
    const response = await timelineWallInstance.get<TimelineCurrentUserResponse>('/auth/currentUser', {
        headers: getAuthHeaders(tokenV3),
    })

    return {
        isAdmin: response.data.isAdmin === true,
    }
}

/**
 * Creates a new timeline event.
 *
 * @param tokenV3 User auth token.
 * @param formData Multipart payload containing timeline event fields.
 * @returns Empty string on success, otherwise an error message.
 */
export async function createTimelineEvent(
    tokenV3: string,
    formData: FormData,
): Promise<string> {
    try {
        await timelineWallInstance.post<FormData, AxiosResponse<unknown>>(
            '/timelineEvents',
            formData,
            {
                headers: {
                    ...getAuthHeaders(tokenV3),
                    'Content-Type': 'multipart/form-data',
                },
            },
        )

        return ''
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const message = (error.response?.data as { message?: string })?.message
            if (message) {
                return message
            }
        }

        return 'There was an error during add event.'
    }
}

/**
 * Deletes a timeline event by id.
 *
 * @param tokenV3 User auth token.
 * @param id Timeline event id.
 * @throws AxiosError When the request is unauthorized or fails.
 */
export async function deleteTimelineEvent(
    tokenV3: string,
    id: string,
): Promise<void> {
    await timelineWallInstance.delete(`/timelineEvents/${encodeURIComponent(id)}`, {
        headers: getAuthHeaders(tokenV3),
    })
}

/**
 * Approves a pending timeline event.
 *
 * @param tokenV3 User auth token.
 * @param id Timeline event id.
 * @throws AxiosError When the request is unauthorized or fails.
 */
export async function approveTimelineEvent(
    tokenV3: string,
    id: string,
): Promise<void> {
    await timelineWallInstance.put(
        `/timelineEvents/${encodeURIComponent(id)}/approve`,
        undefined,
        {
            headers: getAuthHeaders(tokenV3),
        },
    )
}

/**
 * Rejects a pending timeline event.
 *
 * @param tokenV3 User auth token.
 * @param id Timeline event id.
 * @param body Rejection reason payload.
 * @throws AxiosError When the request is unauthorized or fails.
 */
export async function rejectTimelineEvent(
    tokenV3: string,
    id: string,
    body: RejectTimelineEventBody,
): Promise<void> {
    await timelineWallInstance.put(
        `/timelineEvents/${encodeURIComponent(id)}/reject`,
        body,
        {
            headers: {
                ...getAuthHeaders(tokenV3),
                'Content-Type': 'application/json; charset=utf-8',
            },
        },
    )
}

/**
 * Fetches member avatar metadata from the V5 members endpoint.
 *
 * @param handle Member handle.
 * @returns Member handle and resolved avatar URL.
 * @throws AxiosError When the profile request fails.
 */
export async function getMemberAvatar(
    handle: string,
): Promise<MemberAvatar> {
    const response = await axios.get<BackendMemberResponse>(
        `${EnvironmentConfig.API.V5}/members/${encodeURIComponent(handle)}`,
    )

    return {
        handle,
        photoURL: response.data.photoURL || DEFAULT_AVATAR_URL,
    }
}
