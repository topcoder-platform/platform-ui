/**
 * Projects service
 */
import { MockProjectResults } from '../../mock-datas'
import { adjustProjectResult, ProjectResult } from '../models'

/**
 * Fetch project results
 * @returns resolves to the project results
 */
export const fetchProjectResults = async (): Promise<ProjectResult[]> => Promise.resolve(
    MockProjectResults.map(adjustProjectResult) as ProjectResult[],
)
