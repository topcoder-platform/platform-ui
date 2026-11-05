import { FC } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

import { rootRoute } from '../../../config/routes.config'
import {
    getEngagementLeadsTabPath,
    getLeadTypeFromQueryValue,
    LEAD_TYPE_QUERY_PARAM,
} from '../../../lib/utils/engagement-leads.utils'

/**
 * Leads moved to a tab on the Engagements page; this keeps old `/engagement-leads` links working.
 */
export const EngagementLeadsListPage: FC = () => {
    const [searchParams] = useSearchParams()
    const leadType = getLeadTypeFromQueryValue(searchParams.get(LEAD_TYPE_QUERY_PARAM))

    return <Navigate replace to={`${rootRoute}${getEngagementLeadsTabPath(leadType)}`} />
}

export default EngagementLeadsListPage
