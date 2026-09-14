import { EnvironmentConfig } from '~/config'

/**
 * Matches the AGENT_ID registered on `challengeSearchAgent` in tc-ai-api
 * (src/mastra/agents/challenge/challenge-search-agent.ts) — Mastra resolves
 * agents by this id first, before falling back to the registry key.
 */
export const CHALLENGE_SEARCH_AGENT_ID = 'challenge-search-agent'

// The load balancer only forwards `/v6/ai/*` to tc-ai-api. Mastra's built-in
// routes (memory/threads included) live under its configured apiPrefix,
// `/v6/ai/api`; the chat route is a custom route registered as a sibling
// under `/v6/ai/chat` instead, since Mastra reserves apiPrefix exclusively
// for built-ins (see tc-ai-api's src/utils/server-routes.ts).
const LB_ROUTE_CHAT = `${EnvironmentConfig.API.V6}/ai-chat`
const BUILTIN_API_BASE_URL = `${EnvironmentConfig.API.V6}/ai`

export const CHAT_ENDPOINT_URL = `${LB_ROUTE_CHAT}/${CHALLENGE_SEARCH_AGENT_ID}`

export const MEMORY_THREADS_URL = `${BUILTIN_API_BASE_URL}/memory/threads`

export function getMemoryThreadMessagesUrl(threadId: string): string {
    return `${BUILTIN_API_BASE_URL}/memory/threads/${threadId}/messages?agentId=${CHALLENGE_SEARCH_AGENT_ID}`
}

export function getMemoryThreadUrl(threadId: string): string {
    return `${BUILTIN_API_BASE_URL}/memory/threads/${threadId}?agentId=${CHALLENGE_SEARCH_AGENT_ID}`
}
