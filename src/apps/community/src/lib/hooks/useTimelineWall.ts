import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import { EnvironmentConfig } from '~/config'

import { type TimelineEvent } from '../models'
import {
    approveTimelineEvent,
    createTimelineEvent,
    deleteTimelineEvent,
    getCurrentUser,
    getMemberAvatar,
    getPendingApprovals,
    getTimelineEvents,
    rejectTimelineEvent,
    type RejectTimelineEventBody,
} from '../services'

interface TimelineConfigExtension {
    TIMELINE?: {
        FETCHING_PENDING_APPROVAL_EVENTS_INTERVAL?: number
    }
}

interface UseTimelineWallActions {
    approveEvent: (token: string, id: string) => Promise<void>
    deleteEvent: (token: string, id: string) => Promise<void>
    fetchAvatar: (handle: string) => Promise<void>
    loadCurrentUser: (token: string) => Promise<void>
    loadEvents: () => Promise<void>
    loadPendingApprovals: (token: string) => Promise<void>
    removeEvent: (
        token: string,
        id: string,
        body: RejectTimelineEventBody,
    ) => Promise<void>
    submitEvent: (token: string, formData: FormData) => Promise<void>
}

export interface UseTimelineWallResult extends UseTimelineWallActions {
    events: TimelineEvent[]
    isAdmin: boolean
    loading: boolean
    loadingApprovals: boolean
    pendingApprovals: TimelineEvent[]
    uploading: boolean
    uploadResult: string
    userAvatars: Record<string, string>
}

function getPendingApprovalsPollingInterval(): number {
    const timelineConfig
        = (EnvironmentConfig as unknown as TimelineConfigExtension).TIMELINE
    const pollingInterval = timelineConfig?.FETCHING_PENDING_APPROVAL_EVENTS_INTERVAL

    return typeof pollingInterval === 'number' && pollingInterval > 0
        ? pollingInterval
        : 0
}

/**
 * Provides timeline wall state and actions for timeline and moderation flows.
 *
 * @returns Timeline wall data, loading states, and mutation handlers.
 */
export function useTimelineWall(): UseTimelineWallResult {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [pendingApprovals, setPendingApprovals] = useState<TimelineEvent[]>([])
    const [isAdmin, setIsAdmin] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [loadingApprovals, setLoadingApprovals] = useState<boolean>(false)
    const [uploading, setUploading] = useState<boolean>(false)
    const [uploadResult, setUploadResult] = useState<string>('')
    const [userAvatars, setUserAvatars] = useState<Record<string, string>>({})
    const [pendingApprovalsToken, setPendingApprovalsToken] = useState<string | undefined>(undefined)

    const inFlightAvatarRequestsRef = useRef<Record<string, boolean>>({})
    const pendingApprovalsIntervalRef = useRef<number | undefined>(undefined)

    const pendingApprovalsPollingInterval = useMemo(
        () => getPendingApprovalsPollingInterval(),
        [],
    )

    const loadEvents = useCallback(async (): Promise<void> => {
        setLoading(true)

        try {
            const allEvents = await getTimelineEvents()
            setEvents(allEvents)
        } catch {
            setEvents([])
        } finally {
            setLoading(false)
        }
    }, [])

    const loadPendingApprovals = useCallback(async (token: string): Promise<void> => {
        setPendingApprovalsToken(token)
        setLoadingApprovals(true)

        try {
            const approvals = await getPendingApprovals(token)
            setPendingApprovals(approvals)
        } catch {
            setPendingApprovals([])
        } finally {
            setLoadingApprovals(false)
        }
    }, [])

    const loadCurrentUser = useCallback(async (token: string): Promise<void> => {
        setPendingApprovalsToken(token)

        try {
            const currentUser = await getCurrentUser(token)
            setIsAdmin(currentUser.isAdmin === true)
        } catch {
            setIsAdmin(false)
        }
    }, [])

    const submitEvent = useCallback(async (
        token: string,
        formData: FormData,
    ): Promise<void> => {
        setUploading(true)
        setUploadResult('')

        try {
            const result = await createTimelineEvent(token, formData)
            setUploadResult(result)
            await loadEvents()
        } finally {
            setUploading(false)
        }
    }, [loadEvents])

    const removeEvent = useCallback(async (
        token: string,
        id: string,
        body: RejectTimelineEventBody,
    ): Promise<void> => {
        await rejectTimelineEvent(token, id, body)
        await Promise.all([
            loadEvents(),
            loadPendingApprovals(token),
        ])
    }, [loadEvents, loadPendingApprovals])

    const deleteEvent = useCallback(async (
        token: string,
        id: string,
    ): Promise<void> => {
        await deleteTimelineEvent(token, id)
        await Promise.all([
            loadEvents(),
            loadPendingApprovals(token),
        ])
    }, [loadEvents, loadPendingApprovals])

    const approveEvent = useCallback(async (
        token: string,
        id: string,
    ): Promise<void> => {
        await approveTimelineEvent(token, id)
        await Promise.all([
            loadEvents(),
            loadPendingApprovals(token),
        ])
    }, [loadEvents, loadPendingApprovals])

    const fetchAvatar = useCallback(async (handle: string): Promise<void> => {
        if (!handle || userAvatars[handle] || inFlightAvatarRequestsRef.current[handle]) {
            return
        }

        inFlightAvatarRequestsRef.current[handle] = true

        try {
            const avatar = await getMemberAvatar(handle)
            setUserAvatars(previous => ({
                ...previous,
                [avatar.handle]: avatar.photoURL,
            }))
        } finally {
            delete inFlightAvatarRequestsRef.current[handle]
        }
    }, [userAvatars])

    useEffect(() => {
        loadEvents()
            .catch(() => undefined)
    }, [loadEvents])

    useEffect(() => {
        if (pendingApprovalsIntervalRef.current) {
            window.clearInterval(pendingApprovalsIntervalRef.current)
            pendingApprovalsIntervalRef.current = undefined
        }

        if (!isAdmin || !pendingApprovalsToken) {
            return undefined
        }

        loadPendingApprovals(pendingApprovalsToken)
            .catch(() => undefined)

        if (pendingApprovalsPollingInterval > 0) {
            pendingApprovalsIntervalRef.current = window.setInterval(() => {
                loadPendingApprovals(pendingApprovalsToken)
                    .catch(() => undefined)
            }, pendingApprovalsPollingInterval)
        }

        return () => {
            if (pendingApprovalsIntervalRef.current) {
                window.clearInterval(pendingApprovalsIntervalRef.current)
                pendingApprovalsIntervalRef.current = undefined
            }
        }
    }, [
        isAdmin,
        loadPendingApprovals,
        pendingApprovalsPollingInterval,
        pendingApprovalsToken,
    ])

    return {
        approveEvent,
        deleteEvent,
        events,
        fetchAvatar,
        isAdmin,
        loadCurrentUser,
        loadEvents,
        loading,
        loadingApprovals,
        loadPendingApprovals,
        pendingApprovals,
        removeEvent,
        submitEvent,
        uploading,
        uploadResult,
        userAvatars,
    }
}
