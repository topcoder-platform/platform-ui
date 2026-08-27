import { UIMessage } from 'ai'

import { StoredMessage } from './models'

/**
 * Mastra persists messages in its own legacy (AI SDK v4-shaped) format:
 * `{ type: 'tool-invocation', toolInvocation: { toolCallId, toolName, args,
 * state, result, isError } }`. `ai` v7's UIMessage tool parts use a flatter,
 * differently-named shape (`input`/`output`/`state` at the top level), so
 * without translation these parts fail to parse — the tool-call card falls
 * back to a generic "invocation" name, an empty input, and a stuck
 * "running" status. This maps the legacy shape into a v7 `dynamic-tool` part.
 */
interface LegacyToolInvocation {
    toolCallId: string
    toolName: string
    args?: unknown
    state:
        | 'partial-call'
        | 'call'
        | 'result'
        | 'approval-requested'
        | 'approval-responded'
        | 'output-error'
        | 'output-denied'
    result?: unknown
    isError?: boolean
}

interface LegacyToolInvocationPart {
    type: 'tool-invocation'
    toolInvocation: LegacyToolInvocation
    [key: string]: unknown
}

function isLegacyToolInvocationPart(part: Record<string, unknown>): part is LegacyToolInvocationPart {
    return part.type === 'tool-invocation'
        && typeof part.toolInvocation === 'object'
        && part.toolInvocation !== null
}

function errorTextFrom(result: unknown): string {
    return typeof result === 'string' ? result : 'Tool call failed'
}

function toDynamicToolPart(part: LegacyToolInvocationPart): Record<string, unknown> {
    const invocation = part.toolInvocation
    const base = {
        toolCallId: invocation.toolCallId,
        toolName: invocation.toolName,
        type: 'dynamic-tool',
    }

    switch (invocation.state) {
        case 'partial-call':
            return { ...base, input: invocation.args, state: 'input-streaming' }
        case 'call':
        case 'approval-requested':
        case 'approval-responded':
            // Our tools never require approval — fold those states into the
            // plain "waiting on the tool" state rather than fabricate an
            // `approval` object the source data doesn't have.
            return { ...base, input: invocation.args, state: 'input-available' }
        case 'output-error':
        case 'output-denied':
            return {
                ...base,
                errorText: errorTextFrom(invocation.result),
                input: invocation.args,
                state: 'output-error',
            }
        case 'result':
        default:
            return invocation.isError
                ? {
                    ...base,
                    errorText: errorTextFrom(invocation.result),
                    input: invocation.args,
                    state: 'output-error',
                }
                : {
                    ...base,
                    input: invocation.args,
                    output: invocation.result,
                    state: 'output-available',
                }
    }
}

function normalizeStoredPart(part: Record<string, unknown>): Record<string, unknown> {
    return isLegacyToolInvocationPart(part) ? toDynamicToolPart(part) : part
}

/**
 * Converts persisted Memory messages into `ai` UIMessages for display.
 * Every part — text as well as the agent's tool calls (challengeVectorQueryTool,
 * fetchProjectTool) with their input/output — is carried through, so
 * reopening a thread shows the same tool-call visibility a live run does.
 */
export function toChatUIMessages(messages: StoredMessage[]): UIMessage[] {
    return messages
        .filter((message): message is StoredMessage & { role: 'user' | 'assistant' } => (
            message.role === 'user' || message.role === 'assistant'
        ))
        .map(message => ({
            id: message.id,
            parts: (message.content.parts ?? []).map(normalizeStoredPart) as UIMessage['parts'],
            role: message.role,
        }))
        .filter(message => message.parts.length > 0)
}
