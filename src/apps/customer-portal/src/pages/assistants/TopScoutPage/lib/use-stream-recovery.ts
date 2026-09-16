import { useCallback, useRef, useState } from 'react'
import { UIMessage } from 'ai'

import { fetchChatThreadMessages } from './chat.service'
import { toChatUIMessages } from './convert-messages'

const POLL_INTERVAL_MS = 4_000
const POLL_TIMEOUT_MS = 120_000

export type StreamRecoveryStatus = 'idle' | 'recovering' | 'timed-out'

export interface UseStreamRecoveryResult {
    status: StreamRecoveryStatus
    startRecovery: (baselineMessageCount: number) => void
}

/**
 * Mastra only persists the assistant's message once its run finishes, so
 * when the live SSE connection dies mid-response (see stream-watchdog.ts),
 * the recovered answer isn't available yet either — it lands in Postgres
 * whenever the backend run completes, independent of the client connection.
 * This polls thread history until that happens instead of leaving the user
 * to keep manually refreshing.
 *
 * `baselineMessageCount` is the number of non-empty messages the caller
 * already has rendered (mirroring toChatUIMessages' empty-parts filter) —
 * recovery is considered resolved once the fetched thread has more than
 * that many messages and the newest one is from the assistant.
 */
export function useStreamRecovery(
    threadId: string,
    onRecovered: (messages: UIMessage[]) => void,
): UseStreamRecoveryResult {
    const [status, setStatus] = useState<StreamRecoveryStatus>('idle')
    const runIdRef = useRef(0)

    const startRecovery = useCallback((baselineMessageCount: number) => {
        runIdRef.current += 1
        const runId = runIdRef.current
        const deadline = Date.now() + POLL_TIMEOUT_MS
        setStatus('recovering')

        async function poll(): Promise<void> {
            if (runIdRef.current !== runId) {
                return
            }

            try {
                const stored = await fetchChatThreadMessages(threadId)
                const messages = toChatUIMessages(stored)

                if (runIdRef.current !== runId) {
                    return
                }

                const newest = messages[messages.length - 1]

                if (messages.length > baselineMessageCount && newest?.role === 'assistant') {
                    setStatus('idle')
                    onRecovered(messages)
                    return
                }
            } catch (error) {
                console.error('TopScout recovery poll failed:', (error as Error).message)
            }

            if (Date.now() >= deadline) {
                setStatus('timed-out')
                return
            }

            setTimeout(poll, POLL_INTERVAL_MS)
        }

        poll()
    }, [onRecovered, threadId])

    return { startRecovery, status }
}
