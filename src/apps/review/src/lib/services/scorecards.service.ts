/**
 * Scorecards service
 */
import { MockScorecard } from '../../mock-datas'
import { adjustScorecardInfo, ScorecardInfo } from '../models'

/**
 * Fetch scorecard
 * @returns resolves to the scorecard info
 */
export const fetchScorecards
  = async (): Promise<ScorecardInfo> => Promise.resolve(adjustScorecardInfo(MockScorecard) as ScorecardInfo)
