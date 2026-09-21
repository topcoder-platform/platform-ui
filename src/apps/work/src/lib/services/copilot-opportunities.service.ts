import { xhrGetAsync } from '~/libs/core'

import { PROJECTS_API_URL } from '../constants'
import type { CopilotOpportunity } from '../models'

/** Upper bound for the opportunities a single project is expected to have. */
const PROJECT_COPILOT_OPPORTUNITIES_PAGE_SIZE = 100

type CopilotOpportunityApiResponse = Omit<CopilotOpportunity, 'id'> & {
    id: number | string
    copilotRequestId?: number | string
    projectId?: number | string
}

/**
 * Normalizes the identifiers the Projects API may serialize as numbers.
 *
 * @param opportunity raw opportunity payload returned by the Projects API.
 * @returns the opportunity with string identifiers so links can be built safely.
 * @throws Does not throw.
 */
function copilotOpportunityFactory(opportunity: CopilotOpportunityApiResponse): CopilotOpportunity {
    return {
        ...opportunity,
        copilotRequestId: opportunity.copilotRequestId === undefined || opportunity.copilotRequestId === null
            ? undefined
            : String(opportunity.copilotRequestId),
        id: String(opportunity.id),
        projectId: opportunity.projectId === undefined || opportunity.projectId === null
            ? undefined
            : String(opportunity.projectId),
    }
}

/**
 * Reads every copilot opportunity that was created for one project.
 *
 * Used by the project challenges page "View Request" modal so managers and
 * admins can jump from the Work app straight to the copilot opportunities
 * raised for the project they are looking at.
 *
 * @param projectId identifier of the project whose opportunities are listed.
 * @param signal cancels an obsolete request when the modal closes.
 * @returns the project's copilot opportunities, newest first.
 * @throws Propagates network and Projects API errors to the caller.
 */
export function fetchProjectCopilotOpportunities(
    projectId: string,
    signal?: AbortSignal,
): Promise<CopilotOpportunity[]> {
    const query = new URLSearchParams({
        page: '1',
        pageSize: String(PROJECT_COPILOT_OPPORTUNITIES_PAGE_SIZE),
        projectId,
        sort: 'createdAt desc',
    })

    return xhrGetAsync<CopilotOpportunityApiResponse[]>(
        `${PROJECTS_API_URL}/copilots/opportunities?${query.toString()}`,
        undefined,
        { signal },
    )
        .then(opportunities => (opportunities || []).map(copilotOpportunityFactory))
}
