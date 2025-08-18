/**
 * Scorecards service
 */
import { xhrPostAsync, xhrPutAsync } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import { MockScorecard } from '../../mock-datas'
import { adjustScorecardInfo, Scorecard, ScorecardInfo } from '../models'

const baseUrl = `${EnvironmentConfig.API.V6}/review/scorecards`

/**
 * Fetch scorecard
 * @returns resolves to the scorecard info
 */
export const fetchScorecards
  = async (): Promise<ScorecardInfo> => Promise.resolve(adjustScorecardInfo(MockScorecard) as ScorecardInfo)

/**
 * Clone scorecard
 * @param scorecard Scorecard to clone
 * @returns resolves to the cloned scorecard info
 */
export const cloneScorecard = async (scorecard: Pick<Scorecard, 'id'>): Promise<Scorecard> => (
    xhrPostAsync(`${baseUrl}/${scorecard.id}/clone`, {})
)

/**
 * Save scorecard
 * @param scorecard Scorecard data to save
 * @returns resolves to the saved scorecard data
 */
export const saveScorecard = async (scorecard: Scorecard): Promise<Scorecard> => {
    if (!scorecard.id) {
        return xhrPostAsync<Scorecard, Scorecard>(`${baseUrl}`, scorecard)
    }

    return xhrPutAsync<Scorecard, Scorecard>(`${baseUrl}/${scorecard.id}`, scorecard)
}
