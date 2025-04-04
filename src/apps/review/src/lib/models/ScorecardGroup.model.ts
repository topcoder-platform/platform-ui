import _ from 'lodash'

import { ScorecardSection } from './ScorecardSection.model'

/**
 * Scorecard group info
 */
export interface ScorecardGroup {
    id: string
    name: string
    weight: number
    sortOrder: number
    sections: ScorecardSection[]
}

/**
 * Update scorecard info to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustScorecardGroup(
    data: ScorecardGroup | undefined,
): ScorecardGroup | undefined {
    if (!data) {
        return data
    }

    return {
        ...data,
        sections: _.orderBy(data.sections, ['sortOrder'], ['asc']),
    }
}
