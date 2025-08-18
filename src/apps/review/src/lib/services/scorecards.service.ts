/**
 * Scorecards service
 */
import { xhrPostAsync } from '~/libs/core'
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
