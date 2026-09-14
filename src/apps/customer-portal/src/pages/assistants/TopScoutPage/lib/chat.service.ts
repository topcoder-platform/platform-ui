import { xhrDeleteAsync, xhrGetAsync } from '~/libs/core'

import {
    CHALLENGE_SEARCH_AGENT_ID,
    getMemoryThreadMessagesUrl,
    getMemoryThreadUrl,
    MEMORY_THREADS_URL,
} from './constants'
import {
    ChatThreadSummary,
    ListChatThreadMessagesResponse,
    ListChatThreadsResponse,
    StoredMessage,
} from './models'

export async function fetchChatThreads(resourceId: string): Promise<ChatThreadSummary[]> {
    const query = new URLSearchParams({
        agentId: CHALLENGE_SEARCH_AGENT_ID,
        resourceId,
    })

    const response = await xhrGetAsync<ListChatThreadsResponse>(
        `${MEMORY_THREADS_URL}?${query.toString()}`,
    )

    return response.threads ?? []
}

export async function fetchChatThreadMessages(threadId: string): Promise<StoredMessage[]> {
    const response = await xhrGetAsync<ListChatThreadMessagesResponse>(
        getMemoryThreadMessagesUrl(threadId),
    )

    return response.messages ?? []
}

export async function deleteChatThread(threadId: string): Promise<void> {
    await xhrDeleteAsync(getMemoryThreadUrl(threadId))
}
