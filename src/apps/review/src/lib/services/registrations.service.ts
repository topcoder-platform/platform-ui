/**
 * Registrations service
 */
import { MockRegistrations } from '../../mock-datas'
import { adjustRegistrationInfo, RegistrationInfo } from '../models'

/**
 * Fetch challenge registrations
 * @returns resolves to the challenge registrations
 */
export const fetchRegistrations = async (): Promise<RegistrationInfo[]> => Promise.resolve(
    MockRegistrations.map(adjustRegistrationInfo) as RegistrationInfo[],
)
