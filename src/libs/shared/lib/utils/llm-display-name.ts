export interface LlmNameFields {
    name?: string | null
    displayName?: string | null
}

// Provider model ids that must never reach the UI, e.g. AWS Bedrock
// application inference profile ARNs (they expose the AWS account id).
const HIDDEN_MODEL_ID_PATTERN = /^arn:/i

/**
 * Human-readable LLM label: `displayName` when set, otherwise the model id
 * unless it is an ARN. Returns an empty string when there is nothing to show.
 */
export function getLlmDisplayName(llm?: LlmNameFields | null): string {
    const displayName = llm?.displayName?.trim()
    if (displayName) {
        return displayName
    }

    const name = llm?.name?.trim() ?? ''
    return HIDDEN_MODEL_ID_PATTERN.test(name) ? '' : name
}
