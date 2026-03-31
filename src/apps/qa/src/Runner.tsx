/* eslint-disable complexity, consistent-return, max-len, newline-per-chained-call, no-useless-escape, no-void, ordered-imports/ordered-imports, padding-line-between-statements, react/jsx-no-bind, react/jsx-one-expression-per-line, sort-keys, unicorn/no-null */
import { FC, useEffect, useMemo, useRef, useState } from 'react'

import CopyButton from './CopyButton'
import { FLOW_DEFINITIONS } from './flows'
import {
    buildRunStreamRequestAsync,
    fetchChallengeReviewsAsync,
} from './service'
import type {
    ChallengeSnapshot,
    FlowVariant,
    LogEntry,
    RunMode,
    StepEvent,
    StepRequestLog,
    StepRequestMap,
    StepStatus,
} from './types'

interface RunnerProps {
    flow: FlowVariant
    mode: RunMode
    toStep?: string
}

type ReviewRecord = Record<string, unknown>
type StreamErrorState = { message: string; isFinal: boolean }
type RunResult = 'idle' | 'running' | 'success' | 'stopped' | 'cancelled' | 'failure'
type SelectedRequestState = {
    step: string
    item: StepRequestLog
}

const STREAM_RECONNECT_LIMIT = 3
const STREAM_RECONNECT_BASE_DELAY_MS = 1000
const STREAM_RECONNECT_MAX_DELAY_MS = 8000
const REVIEW_FETCH_MIN_INTERVAL_MS = 30_000

const STATUS_UI: Record<StepStatus, { color: string; icon: string; label: string }> = {
    pending: { icon: '•', color: '#94a3b8', label: 'Pending' },
    'in-progress': { icon: '…', color: '#f59e0b', label: 'In progress' },
    success: { icon: '✓', color: '#22c55e', label: 'Success' },
    failure: { icon: '✕', color: '#ef4444', label: 'Failure' },
}

const RUN_RESULT_UI: Record<Exclude<RunResult, 'idle' | 'running'>, {
    background: string
    border: string
    color: string
    label: string
}> = {
    cancelled: {
        background: '#f8fafc',
        border: '#cbd5e1',
        color: '#334155',
        label: 'Run cancelled',
    },
    failure: {
        background: '#fef2f2',
        border: '#fecaca',
        color: '#b91c1c',
        label: 'Run failed',
    },
    stopped: {
        background: '#fffbeb',
        border: '#fde68a',
        color: '#b45309',
        label: 'Run stopped at requested step',
    },
    success: {
        background: '#ecfdf5',
        border: '#86efac',
        color: '#15803d',
        label: 'Run finished successfully',
    },
}

/**
 * Determines whether the provided value is an object record.
 *
 * @param value Value to test.
 * @returns True when the value is a non-null object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

/**
 * Converts a JSON-like value into syntax-highlighted HTML.
 *
 * @param value Value to stringify.
 * @returns HTML string used inside the snapshot and review panels.
 */
function highlightJson(value: unknown): string {
    if (value === undefined) {
        return ''
    }

    const jsonString = JSON.stringify(value, null, 2)
    if (!jsonString) {
        return ''
    }

    const escaped = jsonString
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')

    return escaped.replace(
        /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g,
        match => {
            let color = '#7dd3fc'
            if (match.startsWith('"')) {
                color = match.endsWith(':') ? '#38bdf8' : '#34d399'
            } else if (match === 'true' || match === 'false') {
                color = '#facc15'
            } else if (match === 'null') {
                color = '#94a3b8'
            } else {
                color = '#f97316'
            }

            return `<span style="color: ${color}">${match}</span>`
        },
    )
}

/**
 * Builds the initial step-status state for a run.
 *
 * @param steps Step identifiers in the current flow.
 * @returns Pending status for every step.
 */
function buildInitialStepStatuses(steps: string[]): Record<string, StepStatus> {
    return steps.reduce<Record<string, StepStatus>>((acc, step) => {
        acc[step] = 'pending'
        return acc
    }, {})
}

/**
 * Converts arbitrary values into display-safe strings.
 *
 * @param value Value to display.
 * @returns String representation for the request detail modal.
 */
function stringifyValue(value: unknown): string {
    if (value === undefined || value === null) {
        return '—'
    }

    if (typeof value === 'string') {
        return value
    }

    try {
        return JSON.stringify(value, null, 2)
    } catch {
        return String(value)
    }
}

/**
 * Converts arbitrary values into clipboard-friendly strings.
 *
 * @param value Value to copy.
 * @returns String representation for copy actions.
 */
function stringifyValueForCopy(value: unknown): string {
    if (value === undefined || value === null) {
        return ''
    }

    if (typeof value === 'string') {
        return value
    }

    try {
        return JSON.stringify(value, null, 2)
    } catch {
        return String(value)
    }
}

/**
 * Extracts the latest challenge identifier from a snapshot payload.
 *
 * @param challenge Challenge refresh payload.
 * @returns Challenge identifier when present.
 */
function extractChallengeId(challenge: unknown): string | null {
    if (!isRecord(challenge)) {
        return null
    }

    const nestedChallenge = isRecord(challenge.challenge) ? challenge.challenge : undefined
    const candidate = challenge.id ?? challenge.challengeId ?? nestedChallenge?.id

    if (typeof candidate === 'string' || typeof candidate === 'number') {
        return String(candidate)
    }

    return null
}

/**
 * Determines whether the payload is a structured runner step event.
 *
 * @param value Stream payload candidate.
 * @returns True when the payload matches the step event shape.
 */
function isStepEvent(value: unknown): value is StepEvent {
    return isRecord(value)
        && value.type === 'step'
        && typeof value.step === 'string'
        && typeof value.status === 'string'
}

/**
 * Normalizes the challenge-review payload emitted by the QA API.
 *
 * @param payload Raw review payload.
 * @returns Review items and optional metadata.
 */
function normalizeReviewPayload(
    payload: unknown,
): { items: ReviewRecord[]; meta: Record<string, unknown> | null } {
    if (Array.isArray(payload)) {
        return {
            items: payload.filter(isRecord),
            meta: null,
        }
    }

    if (!isRecord(payload)) {
        return {
            items: [],
            meta: null,
        }
    }

    return {
        items: Array.isArray(payload.data) ? payload.data.filter(isRecord) : [],
        meta: isRecord(payload.meta) ? payload.meta : null,
    }
}

/**
 * Splits a buffered SSE payload into complete event frames plus any remainder.
 *
 * @param buffer Accumulated SSE text buffer.
 * @returns Complete raw event strings and the trailing partial frame.
 */
function consumeSseFrames(buffer: string): { frames: string[]; remainder: string } {
    const normalized = buffer.replaceAll('\r\n', '\n')
    const frames: string[] = []
    let startIndex = 0

    for (;;) {
        const boundaryIndex = normalized.indexOf('\n\n', startIndex)
        if (boundaryIndex === -1) {
            return {
                frames,
                remainder: normalized.slice(startIndex),
            }
        }

        frames.push(normalized.slice(startIndex, boundaryIndex))
        startIndex = boundaryIndex + 2
    }
}

/**
 * Extracts the `data:` payload from a raw SSE frame.
 *
 * @param frame Raw SSE frame text.
 * @returns Concatenated event data or `null` when the frame has no data lines.
 */
function extractSseData(frame: string): string | null {
    const lines = frame
        .split('\n')
        .map(line => line.trimEnd())

    const dataLines = lines
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice('data:'.length).trimStart())

    return dataLines.length > 0 ? dataLines.join('\n') : null
}

/**
 * Streams QA run events and exposes request/snapshot inspection UI.
 */
const Runner: FC<RunnerProps> = (props: RunnerProps) => {
    const definition = FLOW_DEFINITIONS[props.flow]
    const stepIds = useMemo<string[]>(
        () => definition.steps.map(step => step.id),
        [definition],
    )
    const stepLabelLookup = useMemo(() => {
        const map = new Map<string, { index: number; label: string }>()
        definition.steps.forEach((step, index) => {
            map.set(step.id, { label: step.label, index })
        })
        return map
    }, [definition])

    const [isRunning, setIsRunning] = useState(false)
    const [progress, setProgress] = useState(0)
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [streamError, setStreamError] = useState<StreamErrorState | null>(null)
    const [challengeSnapshots, setChallengeSnapshots] = useState<ChallengeSnapshot[]>([])
    const [challengeId, setChallengeId] = useState<string | null>(null)
    const [refreshCount, setRefreshCount] = useState(0)
    const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<string | null>(null)
    const [activeSnapshotTab, setActiveSnapshotTab] = useState<'challenge' | 'reviews'>('challenge')
    const [reviews, setReviews] = useState<ReviewRecord[]>([])
    const [reviewsMeta, setReviewsMeta] = useState<Record<string, unknown> | null>(null)
    const [isLoadingReviews, setIsLoadingReviews] = useState(false)
    const [reviewsError, setReviewsError] = useState<string | null>(null)
    const [reviewFetchCount, setReviewFetchCount] = useState(0)
    const [lastReviewFetchTimestamp, setLastReviewFetchTimestamp] = useState<string | null>(null)
    const [runToken, setRunToken] = useState(0)
    const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(
        () => buildInitialStepStatuses(stepIds),
    )
    const [stepFailures, setStepFailures] = useState<StepRequestMap>({})
    const [stepRequests, setStepRequests] = useState<StepRequestMap>({})
    const [openStep, setOpenStep] = useState<string | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<SelectedRequestState | null>(null)
    const [runResult, setRunResult] = useState<RunResult>('idle')
    const logRef = useRef<HTMLDivElement | null>(null)
    const streamAbortRef = useRef<AbortController | null>(null)
    const streamCompletedRef = useRef(false)
    const reconnectAttemptRef = useRef(0)
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const snapshotCounterRef = useRef(0)
    const lastReviewFetchRef = useRef<{ challengeId: string; timestamp: number } | null>(null)

    useEffect(() => {
        setStepStatuses(buildInitialStepStatuses(stepIds))
        setStepFailures({})
        setStepRequests({})
        setOpenStep(null)
        setSelectedRequest(null)
    }, [stepIds])

    useEffect(() => {
        if (!challengeId || refreshCount === 0) {
            setIsLoadingReviews(false)
            setReviews([])
            setReviewsMeta(null)
            setReviewsError(null)
            setReviewFetchCount(0)
            setLastReviewFetchTimestamp(null)
            lastReviewFetchRef.current = null
            return
        }

        if (activeSnapshotTab !== 'reviews') {
            setIsLoadingReviews(false)
            return
        }

        const lastFetch = lastReviewFetchRef.current
        const now = Date.now()
        if (
            lastFetch
            && lastFetch.challengeId === challengeId
            && now - lastFetch.timestamp < REVIEW_FETCH_MIN_INTERVAL_MS
        ) {
            setIsLoadingReviews(false)
            return
        }

        let isActive = true
        setIsLoadingReviews(true)
        setReviewsError(null)

        fetchChallengeReviewsAsync(challengeId)
            .then(payload => {
                if (!isActive) {
                    return
                }

                const normalized = normalizeReviewPayload(payload)
                setReviews(normalized.items)
                setReviewsMeta(normalized.meta)
                setReviewFetchCount(previous => previous + 1)
                setLastReviewFetchTimestamp(new Date().toISOString())
                lastReviewFetchRef.current = {
                    challengeId,
                    timestamp: Date.now(),
                }
            })
            .catch(error => {
                if (!isActive) {
                    return
                }

                setReviews([])
                setReviewsMeta(null)
                setReviewsError(
                    error instanceof Error
                        ? error.message
                        : String(error),
                )
            })
            .finally(() => {
                if (isActive) {
                    setIsLoadingReviews(false)
                }
            })

        return () => {
            isActive = false
        }
    }, [activeSnapshotTab, challengeId, refreshCount])

    useEffect(() => {
        if (runToken === 0) {
            return undefined
        }

        let isActive = true

        const appendLog = (entry: LogEntry): void => {
            setLogs(previous => [...previous, entry])
            window.setTimeout(() => {
                logRef.current?.scrollTo({
                    top: logRef.current.scrollHeight,
                })
            }, 0)
        }

        const handleStepEvent = (event: StepEvent): void => {
            setStepStatuses(previous => ({
                ...previous,
                [event.step]: event.status,
            }))

            if (event.requests !== undefined) {
                setStepRequests(previous => ({
                    ...previous,
                    [event.step]: event.requests ?? [],
                }))
                setSelectedRequest(previous => {
                    if (!previous || previous.step !== event.step) {
                        return previous
                    }

                    const updated = (event.requests ?? []).find(
                        request => request.id === previous.item.id,
                    )

                    return updated ? { step: event.step, item: updated } : null
                })
            }

            if (event.failedRequests !== undefined) {
                setStepFailures(previous => ({
                    ...previous,
                    [event.step]: event.failedRequests ?? [],
                }))
                return
            }

            if (event.status !== 'failure') {
                setStepFailures(previous => {
                    if (!(event.step in previous)) {
                        return previous
                    }

                    const next = { ...previous }
                    delete next[event.step]
                    return next
                })
            }
        }

        const completeRun = (nextResult: Exclude<RunResult, 'idle' | 'running'>): void => {
            streamCompletedRef.current = true
            setIsRunning(false)
            setRunResult(nextResult)
        }

        const handleStreamPayload = (payloadText: string): void => {
            try {
                const parsed = JSON.parse(payloadText) as unknown

                if (isStepEvent(parsed)) {
                    handleStepEvent(parsed)
                    return
                }

                if (!isRecord(parsed)) {
                    return
                }

                const data: LogEntry = {
                    data: parsed.data,
                    level: typeof parsed.level === 'string' ? parsed.level : 'info',
                    message: typeof parsed.message === 'string' ? parsed.message : '',
                    progress: typeof parsed.progress === 'number' ? parsed.progress : undefined,
                }

                if (typeof data.progress === 'number') {
                    setProgress(data.progress)
                }

                let shouldLog = true
                if (
                    data.message === 'Challenge refresh'
                    && isRecord(data.data)
                    && 'challenge' in data.data
                ) {
                    const stage = typeof data.data.stage === 'string'
                        ? data.data.stage
                        : undefined
                    const currentChallenge = data.data.challenge
                    const extractedChallengeId = extractChallengeId(currentChallenge)
                    if (extractedChallengeId) {
                        setChallengeId(extractedChallengeId)
                    }

                    snapshotCounterRef.current += 1
                    setRefreshCount(snapshotCounterRef.current)
                    setLastRefreshTimestamp(new Date().toISOString())
                    setChallengeSnapshots([{
                        challenge: currentChallenge,
                        id: snapshotCounterRef.current,
                        stage,
                        timestamp: new Date().toISOString(),
                    }])
                    shouldLog = false
                }

                const normalizedMessage = data.message.toLowerCase()
                if (normalizedMessage.includes('stopped at requested step')) {
                    completeRun('stopped')
                } else if (normalizedMessage.includes('run cancelled')) {
                    completeRun('cancelled')
                } else if (data.level === 'error') {
                    completeRun('failure')
                } else if (normalizedMessage.includes('run finished')) {
                    completeRun('success')
                }

                if (shouldLog) {
                    appendLog(data)
                }
            } catch {
                // Ignore malformed log entries to preserve the live stream.
            }
        }

        const scheduleReconnect = (): void => {
            if (!isActive || streamCompletedRef.current || reconnectTimeoutRef.current) {
                return
            }

            const nextAttempt = reconnectAttemptRef.current + 1
            reconnectAttemptRef.current = nextAttempt

            if (nextAttempt <= STREAM_RECONNECT_LIMIT) {
                const delayMs = Math.min(
                    STREAM_RECONNECT_MAX_DELAY_MS,
                    STREAM_RECONNECT_BASE_DELAY_MS * (2 ** (nextAttempt - 1)),
                )
                const delaySeconds = Math.ceil(delayMs / 1000)
                const message = `Run stream disconnected. Reconnecting in ${delaySeconds}s (attempt ${nextAttempt} of ${STREAM_RECONNECT_LIMIT}).`
                setStreamError({
                    message,
                    isFinal: false,
                })
                appendLog({
                    level: 'error',
                    message: 'Run stream disconnected. Attempting to reconnect.',
                    data: {
                        attempt: nextAttempt,
                        delayMs,
                        maxAttempts: STREAM_RECONNECT_LIMIT,
                    },
                })

                reconnectTimeoutRef.current = setTimeout(() => {
                    reconnectTimeoutRef.current = null
                    if (isActive) {
                        void openStream()
                    }
                }, delayMs)
                return
            }

            const message = 'Run stream disconnected. Unable to reconnect; please restart the run.'
            setStreamError({
                message,
                isFinal: true,
            })
            appendLog({ level: 'error', message })
            completeRun('failure')
        }

        async function openStream(): Promise<void> {
            let streamRequest: Awaited<ReturnType<typeof buildRunStreamRequestAsync>>

            try {
                streamRequest = await buildRunStreamRequestAsync(
                    props.flow,
                    props.mode,
                    props.toStep,
                )
            } catch (error) {
                if (!isActive) {
                    return
                }

                const message = error instanceof Error
                    ? error.message
                    : 'Failed to start the QA runner stream'
                setStreamError({ message, isFinal: true })
                appendLog({ level: 'error', message })
                completeRun('failure')
                return
            }

            if (!isActive) {
                return
            }

            const abortController = new AbortController()
            streamAbortRef.current = abortController
            setIsRunning(true)
            setRunResult('running')

            try {
                const response = await fetch(streamRequest.url, {
                    ...streamRequest.init,
                    signal: abortController.signal,
                })

                if (!response.ok || !response.body) {
                    const fallbackMessage = `Failed to open the QA runner stream (${response.status}).`
                    const responseMessage = await response.text().catch(() => fallbackMessage)
                    throw new Error(responseMessage || fallbackMessage)
                }

                if (!isActive) {
                    abortController.abort()
                    return
                }

                if (reconnectAttemptRef.current > 0) {
                    appendLog({
                        level: 'info',
                        message: `Run stream reconnected on attempt ${reconnectAttemptRef.current}.`,
                    })
                }

                reconnectAttemptRef.current = 0
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current)
                    reconnectTimeoutRef.current = null
                }
                setStreamError(null)

                const reader = response.body.getReader()
                const decoder = new TextDecoder()
                let buffer = ''

                for (;;) {
                    // Stream reads must stay sequential to preserve SSE frame order.
                    // eslint-disable-next-line no-await-in-loop
                    const readResult: ReadableStreamReadResult<Uint8Array> = await reader.read()
                    if (readResult.done) {
                        break
                    }

                    buffer += decoder.decode(readResult.value, { stream: true })
                    const frameBatch: { frames: string[]; remainder: string } = consumeSseFrames(buffer)
                    buffer = frameBatch.remainder

                    frameBatch.frames.forEach(frame => {
                        const data = extractSseData(frame)
                        if (data) {
                            handleStreamPayload(data)
                        }
                    })
                }

                buffer += decoder.decode()
                const finalFrameBatch: { frames: string[]; remainder: string } = consumeSseFrames(buffer)
                finalFrameBatch.frames.forEach(frame => {
                    const data = extractSseData(frame)
                    if (data) {
                        handleStreamPayload(data)
                    }
                })

                if (finalFrameBatch.remainder.trim()) {
                    const data = extractSseData(finalFrameBatch.remainder)
                    if (data) {
                        handleStreamPayload(data)
                    }
                }

                if (!streamCompletedRef.current && isActive && !abortController.signal.aborted) {
                    scheduleReconnect()
                }
            } catch (error) {
                if (!isActive || abortController.signal.aborted) {
                    return
                }

                scheduleReconnect()
            } finally {
                if (streamAbortRef.current === abortController) {
                    streamAbortRef.current = null
                }
            }
        }

        void openStream()

        return () => {
            isActive = false

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = null
            }

            if (streamAbortRef.current) {
                streamAbortRef.current.abort()
                streamAbortRef.current = null
            }
        }
    }, [props.flow, props.mode, props.toStep, runToken])

    const startRun = (): void => {
        if (streamAbortRef.current) {
            streamAbortRef.current.abort()
            streamAbortRef.current = null
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }

        reconnectAttemptRef.current = 0
        streamCompletedRef.current = false
        snapshotCounterRef.current = 0
        lastReviewFetchRef.current = null

        setIsRunning(false)
        setProgress(0)
        setLogs([])
        setStreamError(null)
        setChallengeSnapshots([])
        setChallengeId(null)
        setRefreshCount(0)
        setLastRefreshTimestamp(null)
        setActiveSnapshotTab('challenge')
        setReviews([])
        setReviewsMeta(null)
        setReviewsError(null)
        setReviewFetchCount(0)
        setLastReviewFetchTimestamp(null)
        setIsLoadingReviews(false)
        setStepStatuses(buildInitialStepStatuses(stepIds))
        setStepFailures({})
        setStepRequests({})
        setOpenStep(null)
        setSelectedRequest(null)
        setRunResult('running')
        setRunToken(previous => previous + 1)
    }

    const requestEntries = openStep ? stepRequests[openStep] ?? [] : []
    const selectedRequestItem = selectedRequest?.item
    const selectedEndpointDisplay = selectedRequestItem?.endpoint || 'Unknown'
    const selectedRequestBodyDisplay = stringifyValue(selectedRequestItem?.requestBody)
    const selectedResponseBodyDisplay = stringifyValue(selectedRequestItem?.responseBody)
    const selectedResponseHeadersDisplay = selectedRequestItem?.responseHeaders
        ? stringifyValue(selectedRequestItem.responseHeaders)
        : ''
    const totalReviewsCount = typeof reviewsMeta?.totalCount === 'number'
        ? reviewsMeta.totalCount
        : reviews.length
    const runResultBanner = runResult !== 'idle' && runResult !== 'running'
        ? RUN_RESULT_UI[runResult]
        : undefined

    const formatStepTitle = (step: string): string => {
        const entry = stepLabelLookup.get(step)
        if (!entry) {
            return step
        }

        return `${String(entry.index + 1).padStart(2, '0')}. ${entry.label}`
    }

    const reviewStatusText = (() => {
        if (!challengeId) {
            return 'Waiting for challenge before loading reviews'
        }

        if (isLoadingReviews) {
            return 'Loading reviews…'
        }

        if (!lastReviewFetchTimestamp) {
            return 'No reviews fetched yet'
        }

        const fetchSuffix = reviewFetchCount > 0
            ? ` • ${reviewFetchCount} fetch${reviewFetchCount === 1 ? '' : 'es'}`
            : ''
        return `Last fetched ${new Date(lastReviewFetchTimestamp).toLocaleString()} • ${totalReviewsCount} review${totalReviewsCount === 1 ? '' : 's'}${fetchSuffix}`
    })()

    return (
        <>
            <div className='qa-runner-grid'>
                <div className='qa-card' style={{ minWidth: 0 }}>
                    <h3 style={{ marginTop: 0 }}>Run</h3>
                    {runResultBanner ? (
                        <div
                            role='status'
                            style={{
                                marginBottom: 12,
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: `1px solid ${runResultBanner.border}`,
                                background: runResultBanner.background,
                                color: runResultBanner.color,
                                fontSize: 14,
                                fontWeight: 600,
                            }}
                        >
                            {runResultBanner.label}
                        </div>
                    ) : null}
                    {streamError ? (
                        <div
                            role='alert'
                            style={{
                                marginBottom: 12,
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: `1px solid ${streamError.isFinal ? '#fecaca' : '#fde68a'}`,
                                background: streamError.isFinal ? '#fef2f2' : '#fffbeb',
                                color: streamError.isFinal ? '#b91c1c' : '#b45309',
                                fontSize: 13,
                                fontWeight: 500,
                            }}
                        >
                            <span style={{ fontWeight: 700, marginRight: 6 }}>
                                {streamError.isFinal ? 'Stream error:' : 'Stream warning:'}
                            </span>
                            {streamError.message}
                        </div>
                    ) : null}

                    <div className='qa-progress'>
                        <div className='qa-progress__bar' style={{ width: `${progress}%` }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <button type='button' onClick={startRun} className='qa-primary-button'>
                            {isRunning ? 'Restart' : 'Start'}
                        </button>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <h4 style={{ margin: '0 0 8px' }}>Step status</h4>
                        <div
                            style={{
                                display: 'grid',
                                gap: 8,
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            }}
                        >
                            {definition.steps.map(stepInfo => {
                                const step = stepInfo.id
                                const status = stepStatuses[step] ?? 'pending'
                                const statusUi = STATUS_UI[status]
                                const requestsForStep = stepRequests[step] ?? []
                                const failureCount = (stepFailures[step] ?? []).length
                                const allowOpen = status !== 'pending' || requestsForStep.length > 0

                                return (
                                    <button
                                        key={step}
                                        type='button'
                                        disabled={!allowOpen}
                                        onClick={() => {
                                            if (!allowOpen) {
                                                return
                                            }

                                            setOpenStep(step)
                                            setSelectedRequest(null)
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 8,
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1px solid #dbe3f0',
                                            background: '#f8fafc',
                                            color: '#0f172a',
                                            cursor: allowOpen ? 'pointer' : 'default',
                                            opacity: allowOpen ? 1 : 0.75,
                                            textAlign: 'left',
                                        }}
                                    >
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                            <span
                                                style={{
                                                    color: statusUi.color,
                                                    fontWeight: 700,
                                                    fontSize: 18,
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {statusUi.icon}
                                            </span>
                                            <span style={{ fontWeight: 500 }}>{formatStepTitle(step)}</span>
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: '#475569',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            {statusUi.label}
                                            <span className='qa-chip'>
                                                {requestsForStep.length}
                                                {' '}
                                                call{requestsForStep.length === 1 ? '' : 's'}
                                            </span>
                                            {failureCount > 0 ? (
                                                <span className='qa-chip qa-chip--danger'>
                                                    {failureCount}
                                                    {' '}
                                                    error{failureCount === 1 ? '' : 's'}
                                                </span>
                                            ) : null}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div ref={logRef} className='qa-log'>
                        {logs.map(logEntry => (
                            <div
                                key={`${logEntry.level}-${logEntry.message}-${logEntry.progress ?? 'na'}-${stringifyValueForCopy(logEntry.data)}`}
                            >
                                <span>[{logEntry.level.toUpperCase()}]</span>
                                {' '}
                                {logEntry.message}
                                {logEntry.data !== undefined ? (
                                    <pre style={{ display: 'inline-block', marginLeft: 6 }}>
                                        {stringifyValue(logEntry.data)}
                                    </pre>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>

                <div className='qa-card' style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                flexWrap: 'wrap',
                            }}
                        >
                            <h3 style={{ margin: 0 }}>Challenge snapshots</h3>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    justifyContent: 'flex-end',
                                    textAlign: 'right',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <span style={{ color: '#475569', fontSize: 12 }}>
                                    {activeSnapshotTab === 'challenge'
                                        ? lastRefreshTimestamp
                                            ? `Last refresh ${new Date(lastRefreshTimestamp).toLocaleString()} • ${refreshCount} refresh${refreshCount === 1 ? '' : 'es'}`
                                            : 'No refreshes yet'
                                        : reviewStatusText}
                                </span>
                                {challengeId ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ color: '#475569', fontWeight: 500 }}>
                                            ID
                                            {' '}
                                            {challengeId}
                                        </span>
                                        <CopyButton value={challengeId} label='Copy challenge ID' />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <button
                                type='button'
                                onClick={() => setActiveSnapshotTab('challenge')}
                                className={activeSnapshotTab === 'challenge'
                                    ? 'qa-secondary-button qa-secondary-button--active'
                                    : 'qa-secondary-button'}
                            >
                                Challenge
                            </button>
                            <button
                                type='button'
                                onClick={() => setActiveSnapshotTab('reviews')}
                                className={activeSnapshotTab === 'reviews'
                                    ? 'qa-secondary-button qa-secondary-button--active'
                                    : 'qa-secondary-button'}
                            >
                                Reviews
                            </button>
                        </div>
                    </div>

                    <div className='qa-json-panel'>
                        {activeSnapshotTab === 'challenge' ? (
                            challengeSnapshots.length === 0 ? (
                                <div style={{ color: '#64748b' }}>Waiting for challenge refreshes…</div>
                            ) : (
                                challengeSnapshots.map(snapshot => (
                                    <div key={snapshot.id} style={{ marginBottom: 16 }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: 11,
                                                color: '#64748b',
                                            }}
                                        >
                                            <span>
                                                Refresh #
                                                {snapshot.id}
                                                {snapshot.stage ? ` • ${snapshot.stage}` : ''}
                                            </span>
                                            <span>{new Date(snapshot.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <pre
                                            style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}
                                            dangerouslySetInnerHTML={{ __html: highlightJson(snapshot.challenge) }}
                                        />
                                    </div>
                                ))
                            )
                        ) : (
                            <>
                                {isLoadingReviews ? (
                                    <div style={{ color: '#64748b', marginBottom: reviews.length > 0 ? 12 : 0 }}>
                                        Refreshing reviews…
                                    </div>
                                ) : null}
                                {!challengeId ? (
                                    <div style={{ color: '#64748b' }}>
                                        Waiting for challenge before loading reviews…
                                    </div>
                                ) : reviewsError ? (
                                    <div style={{ color: '#b91c1c' }}>
                                        Failed to load reviews:
                                        {' '}
                                        {reviewsError}
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div style={{ color: '#64748b' }}>No reviews returned yet.</div>
                                ) : (
                                    reviews.map((review, index) => {
                                        const status = typeof review.status === 'string'
                                            ? review.status
                                            : ''
                                        const updatedRaw = typeof review.updated === 'string'
                                            ? review.updated
                                            : typeof review.updatedAt === 'string'
                                                ? review.updatedAt
                                                : typeof review.modified === 'string'
                                                    ? review.modified
                                                    : typeof review.created === 'string'
                                                        ? review.created
                                                        : null
                                        const updatedLabel = updatedRaw
                                            ? (() => {
                                                const date = new Date(updatedRaw)
                                                return Number.isNaN(date.valueOf())
                                                    ? updatedRaw
                                                    : date.toLocaleString()
                                            })()
                                            : ''
                                        const keyCandidate = review.id
                                            ?? review.reviewId
                                            ?? review.submissionId
                                            ?? `${updatedRaw || status || 'review'}-${Object.keys(review).length}`
                                        const titleParts = [`Review #${index + 1}`]
                                        if (status) {
                                            titleParts.push(status)
                                        }

                                        return (
                                            <div key={String(keyCandidate)} style={{ marginBottom: 16 }}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        fontSize: 11,
                                                        color: '#64748b',
                                                    }}
                                                >
                                                    <span>{titleParts.join(' • ')}</span>
                                                    <span>{updatedLabel}</span>
                                                </div>
                                                <pre
                                                    style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}
                                                    dangerouslySetInnerHTML={{ __html: highlightJson(review) }}
                                                />
                                            </div>
                                        )
                                    })
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {openStep ? (
                <div className='qa-modal-overlay'>
                    <div className='qa-modal'>
                        <div className='qa-modal__header'>
                            <div>
                                <h3 style={{ margin: 0 }}>Step requests</h3>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
                                    {formatStepTitle(openStep)}
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={() => {
                                    setOpenStep(null)
                                    setSelectedRequest(null)
                                }}
                                className='qa-secondary-button'
                            >
                                Close
                            </button>
                        </div>
                        {requestEntries.length === 0 ? (
                            <p style={{ marginTop: 16, color: '#64748b' }}>
                                No requests were captured for this step yet.
                            </p>
                        ) : (
                            <ul
                                style={{
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: '16px 0 0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                }}
                            >
                                {requestEntries.map(request => {
                                    const summaryParts = [
                                        request.method,
                                        request.endpoint,
                                    ].filter(Boolean).join(' ')
                                    const statusLabel = request.status !== undefined
                                        ? String(request.status)
                                        : '—'
                                    const statusColor = request.outcome === 'failure'
                                        ? '#b91c1c'
                                        : '#15803d'
                                    const timestampLabel = request.timestamp
                                        ? new Date(request.timestamp).toLocaleTimeString()
                                        : null

                                    return (
                                        <li key={request.id} className='qa-request-card'>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <span style={{ fontWeight: 600 }}>
                                                    {summaryParts || request.message || 'Request'}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#475569',
                                                        display: 'flex',
                                                        gap: 12,
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                        <span
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                minWidth: 30,
                                                                padding: '2px 6px',
                                                                borderRadius: 6,
                                                                background: '#e2e8f0',
                                                                color: statusColor,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {statusLabel}
                                                        </span>
                                                        <span style={{ color: statusColor, fontWeight: 600 }}>
                                                            {request.outcome === 'failure' ? 'Failure' : 'Success'}
                                                        </span>
                                                    </span>
                                                    {timestampLabel ? <span>{timestampLabel}</span> : null}
                                                    {typeof request.durationMs === 'number'
                                                        ? <span>{request.durationMs}ms</span>
                                                        : null}
                                                    {request.message ? <span>{request.message}</span> : null}
                                                </span>
                                            </div>
                                            <button
                                                type='button'
                                                onClick={() => setSelectedRequest({
                                                    step: openStep,
                                                    item: request,
                                                })}
                                                className='qa-secondary-button'
                                            >
                                                View details
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            ) : null}

            {selectedRequest ? (
                <div className='qa-modal-overlay'>
                    <div className='qa-modal qa-modal--wide'>
                        <div className='qa-modal__header'>
                            <div>
                                <h3 style={{ margin: 0 }}>Request details</h3>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
                                    {formatStepTitle(selectedRequest.step)}
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedRequest(null)}
                                className='qa-secondary-button'
                            >
                                Close
                            </button>
                        </div>
                        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 8,
                                    }}
                                >
                                    <span style={{ fontSize: 12, color: '#64748b' }}>Endpoint</span>
                                    <CopyButton value={selectedRequestItem?.endpoint} label='Copy endpoint' />
                                </div>
                                <div style={{ fontWeight: 600 }}>{selectedEndpointDisplay}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                <div>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>Method</span>
                                    <div style={{ fontWeight: 600 }}>
                                        {selectedRequestItem?.method || 'Unknown'}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>Status code</span>
                                    <div style={{ fontWeight: 600 }}>
                                        {selectedRequestItem?.status ?? 'Unknown'}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: 12, color: '#64748b' }}>Outcome</span>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        color: selectedRequestItem?.outcome === 'failure'
                                            ? '#b91c1c'
                                            : '#15803d',
                                    }}
                                >
                                    {selectedRequestItem?.outcome === 'failure' ? 'Failure' : 'Success'}
                                </div>
                            </div>
                            {selectedRequestItem?.message ? (
                                <div>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>Message</span>
                                    <div>{selectedRequestItem.message}</div>
                                </div>
                            ) : null}
                            {typeof selectedRequestItem?.durationMs === 'number' ? (
                                <div>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>Duration</span>
                                    <div>{selectedRequestItem.durationMs}ms</div>
                                </div>
                            ) : null}
                            {selectedRequestItem?.timestamp ? (
                                <div>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>Timestamp</span>
                                    <div>{new Date(selectedRequestItem.timestamp).toLocaleString()}</div>
                                </div>
                            ) : null}
                            <div>
                                <div className='qa-detail-header'>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>Request body</span>
                                    <CopyButton
                                        value={stringifyValueForCopy(selectedRequestItem?.requestBody)}
                                        label='Copy request body'
                                    />
                                </div>
                                <pre className='qa-detail-panel'>{selectedRequestBodyDisplay}</pre>
                            </div>
                            <div>
                                <div className='qa-detail-header'>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>Response body</span>
                                    <CopyButton
                                        value={stringifyValueForCopy(selectedRequestItem?.responseBody)}
                                        label='Copy response body'
                                    />
                                </div>
                                <pre className='qa-detail-panel'>{selectedResponseBodyDisplay}</pre>
                            </div>
                            {selectedRequestItem?.responseHeaders ? (
                                <div>
                                    <div className='qa-detail-header'>
                                        <span style={{ fontSize: 12, color: '#64748b' }}>Response headers</span>
                                        <CopyButton
                                            value={stringifyValueForCopy(selectedRequestItem.responseHeaders)}
                                            label='Copy response headers'
                                        />
                                    </div>
                                    <pre className='qa-detail-panel'>{selectedResponseHeadersDisplay}</pre>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    )
}

export default Runner
