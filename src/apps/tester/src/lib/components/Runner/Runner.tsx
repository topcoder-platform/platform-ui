import {
    FC,
    MouseEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import classNames from 'classnames'

import type { SelectOption } from '~/apps/review/src/lib/models'
import { Tabs } from '~/apps/review/src/lib/components/Tabs'
import { ProgressBar } from '~/apps/review/src/lib/components/ProgressBar'

import type { FlowVariant } from '../../types'
import { FLOW_DEFINITIONS } from '../../flows'
import { createRunStream, fetchChallengeReviews } from '../../services/api.service'

import { CopyButton } from './CopyButton'
import { RequestDetailModal } from './RequestDetailModal'
import { RequestModal } from './RequestModal'
import styles from './Runner.module.scss'

export type LogEntry = {
    id: string
    level?: string
    message?: string
    data?: any
    progress?: number
}

export type ChallengeSnapshot = {
    id: number
    stage?: string
    timestamp: string
    challenge: any
}

type ReviewEntry = {
    key: string
    review: any
}

export type StepName = string

export type StepStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped'

type StepStatusEvent = StepStatus | 'in-progress' | 'failure'

export type StepRequestLog = {
    id: string
    method?: string
    endpoint?: string
    status?: number
    message?: string
    requestBody?: unknown
    responseBody?: unknown
    responseHeaders?: Record<string, unknown>
    timestamp?: string
    durationMs?: number
    outcome: 'success' | 'failure'
}

export type StepEvent = {
    type: 'step'
    step: StepName
    status: StepStatusEvent
    requests?: StepRequestLog[]
    failedRequests?: StepRequestLog[]
    timestamp: string
}

type StepRequestMap = Partial<Record<StepName, StepRequestLog[]>>

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'

const MAX_RECONNECT_ATTEMPTS = 3

const highlightJson = (value: unknown): string => {
    if (value === undefined) {
        return ''
    }

    const jsonString = JSON.stringify(value, undefined, 2)
    if (!jsonString) {
        return ''
    }

    const escaped = jsonString
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    return escaped.replace(
        /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
        match => {
            let color = '#BAE6FD'
            if (match.startsWith('"')) {
                color = match.endsWith(':') ? '#38BDF8' : '#34D399'
            } else if (match === 'true' || match === 'false') {
                color = '#FACC15'
            } else if (match === 'null') {
                color = '#94A3B8'
            } else {
                color = '#F97316'
            }

            return `<span style="color: ${color}">${match}</span>`
        },
    )
}

const buildInitialStepStatuses = (steps: StepName[]): Record<StepName, StepStatus> => {
    const initial = {} as Record<StepName, StepStatus>
    for (const step of steps) {
        initial[step] = 'pending'
    }

    return initial
}

const normalizeStepStatus = (status: StepStatusEvent): StepStatus => {
    // Normalize legacy/alternate status values from the stream into UI statuses.
    if (status === 'in-progress') {
        return 'running'
    }

    if (status === 'failure') {
        return 'error'
    }

    return status
}

const STATUS_UI: Record<StepStatus, { color: string; label: string }> = {
    error: { color: '#EF4444', label: 'Error' },
    pending: { color: '#E2E8F0', label: 'Pending' },
    running: { color: '#3B82F6', label: 'Running' },
    skipped: { color: '#94A3B8', label: 'Skipped' },
    success: { color: '#10B981', label: 'Success' },
}

const stringifyValue = (value: unknown): string => {
    const normalized = value ?? undefined
    if (normalized === undefined) {
        return ''
    }

    if (typeof normalized === 'string') {
        return normalized
    }

    try {
        return JSON.stringify(normalized, undefined, 2)
    } catch {
        return String(normalized)
    }
}

// eslint-disable-next-line complexity
export const Runner: FC<{ flow: FlowVariant; mode: 'full' | 'toStep'; toStep?: string }> = (
    props: { flow: FlowVariant; mode: 'full' | 'toStep'; toStep?: string },
) => {
    const flow = props.flow
    const mode = props.mode
    const toStep = props.toStep
    const definition = FLOW_DEFINITIONS[flow]
    const stepIds = useMemo<StepName[]>(
        () => definition.steps.map(step => step.id),
        [definition],
    )

    const stepLabelLookup = useMemo(() => {
        const map = new Map<StepName, { label: string; index: number }>()
        definition.steps.forEach((step, index) => {
            map.set(step.id, { index, label: step.label })
        })
        return map
    }, [definition])

    const [isRunning, setIsRunning] = useState(false)
    const [progress, setProgress] = useState(0)
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [challengeSnapshots, setChallengeSnapshots] = useState<ChallengeSnapshot[]>([])
    const [challengeId, setChallengeId] = useState<string | undefined>(undefined)
    const [refreshCount, setRefreshCount] = useState(0)
    const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<string | undefined>(undefined)
    const [activeSnapshotTab, setActiveSnapshotTab] = useState<'Challenge' | 'Reviews'>('Challenge')
    const [reviews, setReviews] = useState<ReviewEntry[]>([])
    const [reviewsMeta, setReviewsMeta] = useState<Record<string, unknown> | undefined>(undefined)
    const [isLoadingReviews, setIsLoadingReviews] = useState(false)
    const [reviewsError, setReviewsError] = useState<string | undefined>(undefined)
    const [reviewFetchCount, setReviewFetchCount] = useState(0)
    const [lastReviewFetchTimestamp, setLastReviewFetchTimestamp] = useState<string | undefined>(undefined)
    const [runToken, setRunToken] = useState(0)
    const [stepStatuses, setStepStatuses] = useState<Record<StepName, StepStatus>>(
        () => buildInitialStepStatuses(stepIds),
    )
    const [stepFailures, setStepFailures] = useState<StepRequestMap>({})
    const [stepRequests, setStepRequests] = useState<StepRequestMap>({})
    const [openStep, setOpenStep] = useState<StepName | undefined>(undefined)
    const [selectedRequest, setSelectedRequest] = useState<{ step: StepName; item: StepRequestLog } | undefined>(
        undefined,
    )
    const [streamError, setStreamError] = useState<string | undefined>(undefined)
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
    const [reconnectAttempt, setReconnectAttempt] = useState(0)

    const logRef = useRef<HTMLDivElement | null>(undefined as unknown as HTMLDivElement | null)
    const sourceRef = useRef<EventSource | undefined>(undefined)
    const snapshotCounterRef = useRef(0)
    const logCounterRef = useRef(0)
    const reviewFetchControllerRef = useRef<AbortController | undefined>(undefined)
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const reconnectAttemptRef = useRef(0)
    const reviewKeyCounterRef = useRef(0)
    const isRunningRef = useRef(isRunning)

    useEffect(() => {
        isRunningRef.current = isRunning
    }, [isRunning])

    useEffect(() => {
        setStepStatuses(buildInitialStepStatuses(stepIds))
        setStepFailures({})
        setStepRequests({})
        setOpenStep(undefined)
        setSelectedRequest(undefined)
    }, [stepIds])

    useEffect(() => {
        if (!logRef.current) {
            return
        }

        logRef.current.scrollTo({
            top: logRef.current.scrollHeight,
        })
    }, [logs])

    useEffect(() => {
        let isActive = true
        const cleanup = (): void => {
            isActive = false
            // Cleanup timers and close the stream to avoid orphaned connections.
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = undefined
            }

            if (sourceRef.current) {
                sourceRef.current.close()
                sourceRef.current = undefined
            }
        }

        if (runToken === 0) {
            return cleanup
        }

        const params = new URLSearchParams({ flow, mode })
        if (toStep) {
            params.set('toStep', toStep)
        }

        // Encapsulate SSE wiring so reconnects can reuse the same setup.
        const connect = (): void => {
            const attempt = reconnectAttemptRef.current
            setConnectionStatus(attempt > 0 ? 'reconnecting' : 'connecting')
            setStreamError(
                attempt > 0
                    ? `Connection lost. Reconnecting (attempt ${attempt} of ${MAX_RECONNECT_ATTEMPTS})...`
                    : undefined,
            )

            const es = createRunStream(params)
            sourceRef.current = es
            setIsRunning(true)

            // Step events drive the status grid and request capture.
            const handleStepEvent = (event: StepEvent): void => {
                const normalizedStatus = normalizeStepStatus(event.status)
                setStepStatuses(prev => ({ ...prev, [event.step]: normalizedStatus }))

                if (event.requests !== undefined) {
                    setStepRequests(prev => ({ ...prev, [event.step]: event.requests ?? [] }))
                    setSelectedRequest(prev => {
                        if (!prev || prev.step !== event.step) {
                            return prev
                        }

                        const updated = (event.requests ?? []).find(item => item.id === prev.item.id)
                        if (!updated) {
                            return undefined
                        }

                        return { item: updated, step: event.step }
                    })
                }

                if (event.failedRequests !== undefined) {
                    setStepFailures(prev => ({ ...prev, [event.step]: event.failedRequests ?? [] }))
                } else if (normalizedStatus !== 'error') {
                    setStepFailures(prev => {
                        if (!(event.step in prev)) {
                            return prev
                        }

                        const next = { ...prev } as StepRequestMap
                        delete next[event.step]
                        return next
                    })
                }
            }

            es.onopen = () => {
                if (!isActive) {
                    return
                }

                setConnectionStatus('connected')
                setStreamError(undefined)
                if (reconnectAttemptRef.current > 0) {
                    reconnectAttemptRef.current = 0
                    setReconnectAttempt(0)
                }
            }

            // eslint-disable-next-line complexity
            es.onmessage = event => {
                try {
                    const parsed = JSON.parse(event.data)

                    if (parsed?.type === 'step') {
                        handleStepEvent(parsed as StepEvent)
                        return
                    }

                    const data = parsed as Omit<LogEntry, 'id'>

                    if (typeof data.progress === 'number') {
                        setProgress(data.progress)
                    }

                    let shouldLog = true

                    if (data.message === 'Challenge refresh' && data.data?.challenge) {
                        snapshotCounterRef.current += 1
                        setRefreshCount(snapshotCounterRef.current)
                        const stage = typeof data.data.stage === 'string' ? data.data.stage : undefined
                        const currentChallenge = data.data.challenge
                        const extractedId = (() => {
                            if (!currentChallenge) {
                                return undefined
                            }

                            const idCandidate = currentChallenge.id
                                ?? currentChallenge.challengeId
                                ?? currentChallenge.challenge?.id
                            if (typeof idCandidate === 'string' || typeof idCandidate === 'number') {
                                return String(idCandidate)
                            }

                            return undefined
                        })()
                        if (extractedId) {
                            setChallengeId(extractedId)
                        }

                        const timestamp = new Date()
                            .toISOString()
                        setLastRefreshTimestamp(timestamp)
                        setChallengeSnapshots([{
                            challenge: currentChallenge,
                            id: snapshotCounterRef.current,
                            stage,
                            timestamp,
                        }])
                        shouldLog = false
                    }

                    const normalized = data.message?.toLowerCase?.() || ''
                    if (
                        normalized.includes('run finished')
                        || normalized.includes('run cancelled')
                        || data.level === 'error'
                        || data.progress === 100
                    ) {
                        setIsRunning(false)
                        setConnectionStatus('idle')
                        if (sourceRef.current) {
                            sourceRef.current.close()
                            sourceRef.current = undefined
                        }
                    }

                    if (shouldLog) {
                        logCounterRef.current += 1
                        setLogs(prev => [...prev, { ...data, id: `log-${logCounterRef.current}` }])
                    }
                } catch {
                    // Ignore malformed log entries.
                }
            }

            // Reconnect with backoff while the run is active; otherwise stop quietly.
            es.onerror = () => {
                es.close()
                if (sourceRef.current === es) {
                    sourceRef.current = undefined
                }

                if (!isActive) {
                    return
                }

                if (!isRunningRef.current) {
                    setConnectionStatus('idle')
                    return
                }

                if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
                    setStreamError('Connection lost. Please restart the run.')
                    setConnectionStatus('error')
                    setIsRunning(false)
                    return
                }

                reconnectAttemptRef.current += 1
                setReconnectAttempt(reconnectAttemptRef.current)
                setConnectionStatus('reconnecting')
                const reconnectLabel = [
                    'Connection lost. Reconnecting',
                    `(attempt ${reconnectAttemptRef.current} of ${MAX_RECONNECT_ATTEMPTS})...`,
                ].join(' ')
                setStreamError(reconnectLabel)

                const delay = 1000 * reconnectAttemptRef.current
                reconnectTimeoutRef.current = setTimeout(() => {
                    if (isActive) {
                        connect()
                    }
                }, delay)
            }
        }

        connect()

        return cleanup
    }, [runToken, mode, toStep, flow])

    useEffect(() => () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = undefined
        }

        if (reviewFetchControllerRef.current) {
            reviewFetchControllerRef.current.abort()
            reviewFetchControllerRef.current = undefined
        }
    }, [])

    useEffect(() => {
        let controller: AbortController | undefined
        const cleanup = (): void => {
            if (controller) {
                controller.abort()
            }
        }

        if (!challengeId || refreshCount === 0) {
            if (reviewFetchControllerRef.current) {
                reviewFetchControllerRef.current.abort()
                reviewFetchControllerRef.current = undefined
            }

            setIsLoadingReviews(false)
            setReviews([])
            setReviewsMeta(undefined)
            setReviewsError(undefined)
            setReviewFetchCount(0)
            setLastReviewFetchTimestamp(undefined)
            return cleanup
        }

        controller = new AbortController()
        if (reviewFetchControllerRef.current) {
            reviewFetchControllerRef.current.abort()
        }

        reviewFetchControllerRef.current = controller
        setIsLoadingReviews(true)
        setReviewsError(undefined)

        const buildReviewKey = (review: any): string => {
            const candidate = review?.id
                ?? review?.reviewId
                ?? review?.submissionId
                ?? review?.updated
                ?? review?.updatedAt
                ?? review?.modified
                ?? review?.created
            if (candidate !== undefined) {
                return String(candidate)
            }

            reviewKeyCounterRef.current += 1
            return `review-${reviewKeyCounterRef.current}`
        }

        const load = async (): Promise<void> => {
            try {
                const json = await fetchChallengeReviews(challengeId, controller.signal)
                const items = Array.isArray(json)
                    ? json
                    : Array.isArray((json as any)?.data)
                        ? (json as any).data
                        : []
                const meta = !Array.isArray(json) && json && typeof json === 'object'
                    ? (json as any).meta ?? undefined
                    : undefined

                if (controller.signal.aborted) {
                    return
                }

                const entries = items.map((review: any) => ({
                    key: buildReviewKey(review),
                    review,
                }))

                setReviews(entries)
                setReviewsMeta(meta)
                setReviewFetchCount(prev => prev + 1)
                setLastReviewFetchTimestamp(new Date()
                    .toISOString())
            } catch (error: unknown) {
                const namedError = error as { name?: string; message?: string }
                if (namedError?.name === 'AbortError' || controller.signal.aborted) {
                    return
                }

                setReviews([])
                setReviewsMeta(undefined)
                setReviewsError(namedError?.message || String(error))
            }

            if (controller.signal.aborted) {
                return
            }

            setIsLoadingReviews(false)
            if (reviewFetchControllerRef.current === controller) {
                reviewFetchControllerRef.current = undefined
            }
        }

        load()

        return cleanup
    }, [challengeId, refreshCount])

    function startRun(): void {
        if (sourceRef.current) {
            sourceRef.current.close()
            sourceRef.current = undefined
        }

        if (reviewFetchControllerRef.current) {
            reviewFetchControllerRef.current.abort()
            reviewFetchControllerRef.current = undefined
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = undefined
        }

        // Reset UI state before starting a new run token.
        setIsRunning(false)
        setLogs([])
        setChallengeSnapshots([])
        setChallengeId(undefined)
        setRefreshCount(0)
        setLastRefreshTimestamp(undefined)
        setActiveSnapshotTab('Challenge')
        setReviews([])
        setReviewsMeta(undefined)
        setReviewsError(undefined)
        setReviewFetchCount(0)
        setLastReviewFetchTimestamp(undefined)
        setIsLoadingReviews(false)
        logCounterRef.current = 0
        reviewKeyCounterRef.current = 0
        snapshotCounterRef.current = 0
        setProgress(0)
        setStepStatuses(buildInitialStepStatuses(stepIds))
        setStepFailures({})
        setStepRequests({})
        setOpenStep(undefined)
        setSelectedRequest(undefined)
        setStreamError(undefined)
        setConnectionStatus('idle')
        reconnectAttemptRef.current = 0
        setReconnectAttempt(0)
        setRunToken(prev => prev + 1)
    }

    function handleStepClick(event: MouseEvent<HTMLButtonElement>): void {
        const stepId = event.currentTarget.dataset.stepId
        const allowOpen = event.currentTarget.dataset.allowOpen === 'true'
        if (!stepId || !allowOpen) {
            return
        }

        setOpenStep(stepId)
        setSelectedRequest(undefined)
    }

    function handleTabChange(value: string): void {
        setActiveSnapshotTab(value as 'Challenge' | 'Reviews')
    }

    function handleRequestModalClose(): void {
        setOpenStep(undefined)
        setSelectedRequest(undefined)
    }

    function handleRequestSelect(request: StepRequestLog): void {
        if (!openStep) {
            return
        }

        setSelectedRequest({ item: request, step: openStep })
    }

    function handleDetailModalClose(): void {
        setSelectedRequest(undefined)
    }

    const requestEntries = openStep ? stepRequests[openStep] ?? [] : []

    const formatStepTitle = (step: StepName): string => {
        const entry = stepLabelLookup.get(step)
        if (!entry) {
            return step
        }

        const prefix = `${String(entry.index + 1)
            .padStart(2, '0')}. `
        return `${prefix}${entry.label}`
    }

    const totalReviewsCount = (() => {
        if (reviewsMeta && typeof (reviewsMeta as any).totalCount === 'number') {
            return (reviewsMeta as any).totalCount as number
        }

        return reviews.length
    })()

    const reviewStatusText = (() => {
        if (!challengeId) {
            return 'Waiting for challenge before loading reviews.'
        }

        if (isLoadingReviews) {
            return 'Loading reviews...'
        }

        if (!lastReviewFetchTimestamp) {
            return 'No reviews fetched yet.'
        }

        const count = totalReviewsCount
        const fetchSuffix = reviewFetchCount > 0
            ? ` - ${reviewFetchCount} fetch${reviewFetchCount === 1 ? '' : 'es'}`
            : ''
        return `Last fetched ${new Date(lastReviewFetchTimestamp)
            .toLocaleString()} - ${count} review${count === 1 ? '' : 's'}${fetchSuffix}`
    })()

    const refreshStatusText = lastRefreshTimestamp
        ? `Last refresh ${new Date(lastRefreshTimestamp)
            .toLocaleString()} - ${refreshCount} refresh${
            refreshCount === 1 ? '' : 'es'
        }`
        : 'No refreshes yet.'

    const tabs: SelectOption[] = useMemo(
        () => [
            { label: 'Challenge', value: 'Challenge' },
            { label: 'Reviews', value: 'Reviews' },
        ],
        [],
    )

    const connectionStatusLabel = useMemo(() => {
        if (connectionStatus === 'connected') {
            return 'Connected'
        }

        if (connectionStatus === 'connecting') {
            return 'Connecting...'
        }

        if (connectionStatus === 'reconnecting') {
            return `Reconnecting (${reconnectAttempt}/${MAX_RECONNECT_ATTEMPTS})`
        }

        if (connectionStatus === 'error') {
            return 'Disconnected'
        }

        return 'Idle'
    }, [connectionStatus, reconnectAttempt])

    return (
        <div className={styles.container}>
            <div className={styles.columns}>
                <div className={styles.column}>
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.heading}>Run</h3>
                            <button className='filledButton' type='button' onClick={startRun}>
                                {isRunning ? 'Restart' : 'Start'}
                            </button>
                        </div>
                        <div className={styles.progressWrapper}>
                            <ProgressBar progress={progress} />
                            <div className={styles.progressMeta}>
                                <span className={styles.progressText}>{`${Math.round(progress)}% complete`}</span>
                                <span
                                    className={classNames(
                                        styles.connectionStatus,
                                        styles[`connectionStatus--${connectionStatus}`],
                                    )}
                                >
                                    {connectionStatusLabel}
                                </span>
                            </div>
                            {streamError ? (
                                <div className={styles.errorText}>{streamError}</div>
                            ) : undefined}
                        </div>
                        <div>
                            <h4 className={styles.subheading}>Step status</h4>
                            <div className={styles.stepsGrid}>
                                {definition.steps.map(stepInfo => {
                                    const step = stepInfo.id
                                    const status = stepStatuses[step] ?? 'pending'
                                    const ui = STATUS_UI[status]
                                    const requestsForStep = stepRequests[step] ?? []
                                    const allowOpen = status !== 'pending' || requestsForStep.length > 0
                                    const failureCount = (stepFailures[step] ?? []).length

                                    return (
                                        <button
                                            key={step}
                                            type='button'
                                            disabled={!allowOpen}
                                            data-step-id={step}
                                            data-allow-open={allowOpen ? 'true' : 'false'}
                                            onClick={handleStepClick}
                                            className={classNames(
                                                styles.stepCard,
                                                styles[`stepCard--${status}`],
                                            )}
                                        >
                                            <div className={styles.stepMain}>
                                                <span
                                                    className={styles.statusIndicator}
                                                    style={{ backgroundColor: ui.color }}
                                                />
                                                <span className={styles.stepTitle}>{formatStepTitle(step)}</span>
                                            </div>
                                            <div className={styles.stepMeta}>
                                                <span>{ui.label}</span>
                                                <span className={styles.countBadge}>
                                                    {requestsForStep.length}
                                                    {' '}
                                                    call
                                                    {requestsForStep.length === 1 ? '' : 's'}
                                                </span>
                                                {failureCount > 0 ? (
                                                    <span className={styles.errorBadge}>
                                                        {failureCount}
                                                        {' '}
                                                        error
                                                        {failureCount === 1 ? '' : 's'}
                                                    </span>
                                                ) : undefined}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.heading}>Logs</h3>
                        </div>
                        <div className={styles.logsContainer} ref={logRef}>
                            {logs.length === 0 ? (
                                <div className={styles.emptyState}>Logs will appear here when the run starts.</div>
                            ) : (
                                logs.map(entry => {
                                    const levelLabel = entry.level ? entry.level.toUpperCase() : 'INFO'
                                    return (
                                        <div key={entry.id} className={styles.logEntry}>
                                            <span className={styles.logLevel}>
                                                [
                                                {levelLabel}
                                                ]
                                            </span>
                                            <span className={styles.logMessage}>{entry.message || 'Log entry'}</span>
                                            {entry.data ? (
                                                <pre className={styles.logData}>{stringifyValue(entry.data)}</pre>
                                            ) : undefined}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </section>
                </div>

                <div className={styles.column}>
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <h3 className={styles.heading}>Challenge snapshots</h3>
                                <p className={styles.subText}>
                                    {activeSnapshotTab === 'Challenge'
                                        ? refreshStatusText
                                        : reviewStatusText}
                                </p>
                            </div>
                            {challengeId ? (
                                <div className={styles.copyRow}>
                                    <span className={styles.subText}>
                                        ID
                                        {challengeId}
                                    </span>
                                    <CopyButton value={challengeId} label='Copy challenge ID' />
                                </div>
                            ) : undefined}
                        </div>

                        <div className={styles.tabsContainer}>
                            <Tabs
                                items={tabs}
                                selected={activeSnapshotTab}
                                onChange={handleTabChange}
                            />
                        </div>

                        <div className={styles.snapshotBody}>
                            {activeSnapshotTab === 'Challenge' ? (
                                challengeSnapshots.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        Waiting for challenge refreshes...
                                    </div>
                                ) : (
                                    challengeSnapshots.map(snapshot => (
                                        <div key={snapshot.id} className={styles.snapshotItem}>
                                            <div className={styles.snapshotHeader}>
                                                <span>
                                                    Refresh #
                                                    {snapshot.id}
                                                    {snapshot.stage ? ` - ${snapshot.stage}` : ''}
                                                </span>
                                                <span>
                                                    {new Date(snapshot.timestamp)
                                                        .toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <pre
                                                className={styles.jsonDisplay}
                                                dangerouslySetInnerHTML={{ __html: highlightJson(snapshot.challenge) }}
                                            />
                                        </div>
                                    ))
                                )
                            ) : (
                                <>
                                    {isLoadingReviews ? (
                                        <div className={styles.loadingNotice}>Refreshing reviews...</div>
                                    ) : undefined}
                                    {!challengeId ? (
                                        <div className={styles.emptyState}>
                                            Waiting for challenge before loading reviews...
                                        </div>
                                    ) : reviewsError ? (
                                        <div className={styles.errorText}>
                                            Failed to load reviews:
                                            {reviewsError}
                                        </div>
                                    ) : reviews.length === 0 ? (
                                        <div className={styles.emptyState}>No reviews returned yet.</div>
                                    ) : (
                                        reviews.map((entry, index) => {
                                            const review = entry.review
                                            const status = typeof review?.status === 'string' ? review.status : ''
                                            const updatedRaw = typeof review?.updated === 'string'
                                                ? review.updated
                                                : typeof review?.updatedAt === 'string'
                                                    ? review.updatedAt
                                                    : typeof review?.modified === 'string'
                                                        ? review.modified
                                                        : typeof review?.created === 'string'
                                                            ? review.created
                                                            : undefined
                                            const updatedLabel = (() => {
                                                if (!updatedRaw) {
                                                    return ''
                                                }

                                                const date = new Date(updatedRaw)
                                                return Number.isNaN(date.valueOf())
                                                    ? updatedRaw
                                                    : date.toLocaleString()
                                            })()
                                            const titleParts = [`Review #${index + 1}`]
                                            if (status) {
                                                titleParts.push(status)
                                            }

                                            return (
                                                <div key={entry.key} className={styles.snapshotItem}>
                                                    <div className={styles.snapshotHeader}>
                                                        <span>{titleParts.join(' - ')}</span>
                                                        <span>{updatedLabel}</span>
                                                    </div>
                                                    <pre
                                                        className={styles.jsonDisplay}
                                                        dangerouslySetInnerHTML={{ __html: highlightJson(review) }}
                                                    />
                                                </div>
                                            )
                                        })
                                    )}
                                </>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            <RequestModal
                isOpen={Boolean(openStep)}
                stepTitle={openStep ? formatStepTitle(openStep) : ''}
                requests={requestEntries}
                onClose={handleRequestModalClose}
                onSelect={handleRequestSelect}
            />
            <RequestDetailModal
                isOpen={Boolean(selectedRequest)}
                stepTitle={selectedRequest ? formatStepTitle(selectedRequest.step) : ''}
                request={selectedRequest?.item ?? undefined}
                onClose={handleDetailModalClose}
            />
        </div>
    )
}

export default Runner
