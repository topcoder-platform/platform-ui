import _ from 'lodash'

import { adjustScorecardGroup, ScorecardGroup } from './ScorecardGroup.model'

/**
 * Scorecard info
 */
export interface ScorecardInfo {
    id: string
    name: string
    minimumPassingScore?: number
    scorecardGroups: ScorecardGroup[]
}

/**
 * Update scorecard info to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustScorecardInfo(
    data: ScorecardInfo,
): ScorecardInfo {
    return {
        ...data,
        scorecardGroups: _.orderBy(
            data.scorecardGroups.map(adjustScorecardGroup) as ScorecardGroup[],
            ['sortOrder'],
            ['asc'],
        ),
    }
}
