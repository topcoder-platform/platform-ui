import useSWR, { SWRResponse } from 'swr'

import type { CopilotOpportunity } from '../models'
import { fetchProjectCopilotOpportunities } from '../services'

export interface UseFetchProjectCopilotOpportunitiesResult {
    error: Error | undefined
    isLoading: boolean
    mutate: SWRResponse<CopilotOpportunity[], Error>['mutate']
    opportunities: CopilotOpportunity[]
}

/**
 * Loads the copilot opportunities raised for one project.
 *
 * Used by the project challenges page "View Request" modal, which lists the
 * copilot opportunities created for the project so managers and admins can open
 * them in the Copilots app.
 *
 * @param projectId project whose opportunities are listed; the request is
 * skipped while this is `undefined` so the modal can mount before a project is
 * resolved.
 * @returns the opportunities plus request state for the modal.
 * @throws Does not throw; request failures surface through `error`.
 */
export function useFetchProjectCopilotOpportunities(
    projectId: string | undefined,
): UseFetchProjectCopilotOpportunitiesResult {
    const swrKey = projectId
        ? ['work/project-copilot-opportunities', projectId]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<CopilotOpportunity[], Error>
        = useSWR<CopilotOpportunity[], Error>(
            swrKey,
            () => fetchProjectCopilotOpportunities(projectId as string),
            {
                errorRetryCount: 1,
                revalidateOnFocus: false,
            },
        )

    return {
        error,
        isLoading: !!projectId && !data && !error,
        mutate,
        opportunities: data || [],
    }
}

export default useFetchProjectCopilotOpportunities
