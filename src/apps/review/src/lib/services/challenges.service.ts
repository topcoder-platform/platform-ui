/**
 * Challenges service
 */
import { MockChallengeInfo } from '../../mock-datas'
import { adjustChallengeInfo, ChallengeInfo } from '../models'

/**
 * Fetch challenge info
 * @returns resolves to the challenge info
 */
export const fetchChallengeInfo = async (): Promise<ChallengeInfo> => Promise.resolve(
    adjustChallengeInfo(MockChallengeInfo) as ChallengeInfo,
)
