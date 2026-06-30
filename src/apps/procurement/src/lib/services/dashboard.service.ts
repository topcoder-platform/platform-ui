import { getAsync } from '~/libs/core/lib/xhr/xhr-functions/xhr.functions'

import { DashboardSummary } from '../models'
import { buildProcurementApiUrl } from '../utils/api.utils'

/**
 * API helpers for procurement dashboard endpoints.
 */

/**
 * Loads the procurement dashboard summary.
 *
 * @returns Dashboard summary response.
 */
export function getDashboardSummary(): Promise<DashboardSummary> {
    return getAsync<DashboardSummary>(buildProcurementApiUrl('dashboard'))
}
