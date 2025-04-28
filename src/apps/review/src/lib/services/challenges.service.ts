/**
 * Challenges service
 */
import { MockChalenges, MockChallengeInfo } from '../../mock-datas'
import { adjustChallengeInfo, ChallengeInfo } from '../models'

/**
 * Fetch challenge info
 * @returns resolves to the challenge info
 */
export const fetchChallengeInfo = async (): Promise<ChallengeInfo> => Promise.resolve(
    adjustChallengeInfo(MockChallengeInfo) as ChallengeInfo,
)

export const fetchChallengeInfoById = async (id: string): Promise<ChallengeInfo> => Promise.resolve(
    adjustChallengeInfo(MockChalenges.find(c => c.id === id)) as ChallengeInfo,
)
