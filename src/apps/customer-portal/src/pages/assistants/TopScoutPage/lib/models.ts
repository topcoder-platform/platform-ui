export interface ChatThreadSummary {
    id: string
    resourceId: string
    title?: string
    createdAt: string
    updatedAt: string
}

export interface ListChatThreadsResponse {
    threads: ChatThreadSummary[]
}

export interface StoredMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: {
        // Text, tool-call, reasoning, etc. — passed through as stored so
        // tool-call input/output stay visible on thread reload; shaped to
        // match `ai`'s UIMessage parts by construction on the server side.
        parts?: Array<Record<string, unknown>>
    }
}

export interface ListChatThreadMessagesResponse {
    messages: StoredMessage[]
}
