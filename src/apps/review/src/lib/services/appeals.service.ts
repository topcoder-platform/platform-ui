/**
 * Appeals service
 */
import { MockAppeals } from '../../mock-datas'
import { AppealInfo } from '../models'

/**
 * Fetch appeals
 * @returns resolves to the array of appeal
 */
export const fetchAppeals = async (): Promise<AppealInfo[]> => Promise.resolve(
    MockAppeals,
)
