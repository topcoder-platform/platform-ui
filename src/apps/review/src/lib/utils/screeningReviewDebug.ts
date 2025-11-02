/**
 * Util for screening review debugging and checkpoint diagnostics
 */

import { EnvironmentConfig } from '~/config'

export const DEBUG_CHECKPOINT_PHASES = Boolean(
    (EnvironmentConfig as unknown as { DEBUG_CHECKPOINT_PHASES?: boolean }).DEBUG_CHECKPOINT_PHASES,
)

export const MAX_DEBUG_METADATA_LENGTH = 200
export const MAX_CHECKPOINT_DEBUG_ENTRIES = 60
export const CHECKPOINT_DEBUG_EXPORT_KEY = '__TC_REVIEW_SCREENING_DEBUG__'

export interface CheckpointDebugEntry {
    level: 'debug' | 'warn'
    namespace: string
    payload: unknown
}

export const checkpointDebugEntries: CheckpointDebugEntry[] = []

/**
 * Export checkpoint logs to the global scope for debugging.
 * @returns void
 */
export function exportCheckpointLogs(): void {
    if (typeof globalThis !== 'object') {
        return
    }

    const globalTarget = globalThis as Record<string, unknown>
    globalTarget[CHECKPOINT_DEBUG_EXPORT_KEY] = [...checkpointDebugEntries]
}

/**
 * Record a checkpoint log entry and update the exported logs.
 * @param level log level
 * @param namespace namespace for the log entry
 * @param payload payload associated with the log entry
 * @returns void
 */
export function recordCheckpointLog(
    level: CheckpointDebugEntry['level'],
    namespace: string,
    payload: unknown,
): void {
    if (!DEBUG_CHECKPOINT_PHASES) {
        return
    }

    checkpointDebugEntries.push({ level, namespace, payload })
    if (checkpointDebugEntries.length > MAX_CHECKPOINT_DEBUG_ENTRIES) {
        checkpointDebugEntries.shift()
    }

    exportCheckpointLogs()
}

/**
 * Truncate string payloads for concise logging.
 * @param value string value to truncate
 * @param maxLength maximum length of the result
 * @returns truncated string
 */
export function truncateForLog(value: string | undefined, maxLength: number = MAX_DEBUG_METADATA_LENGTH): string {
    if (!value) {
        return ''
    }

    if (value.length <= maxLength) {
        return value
    }

    return `${value.slice(0, maxLength)}...`
}

/**
 * Record a debug-level checkpoint log entry.
 * @param namespace namespace for the log entry
 * @param payload payload associated with the log entry
 * @returns void
 */
export function debugLog(namespace: string, payload: unknown): void {
    recordCheckpointLog('debug', namespace, payload)
}

/**
 * Record a warn-level checkpoint log entry.
 * @param namespace namespace for the log entry
 * @param payload payload associated with the log entry
 * @returns void
 */
export function warnLog(namespace: string, payload: unknown): void {
    recordCheckpointLog('warn', namespace, payload)
}
