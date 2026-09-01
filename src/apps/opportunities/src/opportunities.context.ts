import { createContext } from 'react'

import { OpportunityView } from './models'

/** Controlled list/grid presentation shared by all Opportunities child routes. */
export interface OpportunityViewContextData {
    onViewChange: (view: OpportunityView) => void
    view: OpportunityView
}

/** Default presentation used before the Opportunities app shell mounts. */
const defaultOpportunityViewContext: OpportunityViewContextData = {
    onViewChange: () => undefined,
    view: 'list',
}

/** Persistent view context provided by the Opportunities route shell. */
export const opportunityViewContext = createContext<OpportunityViewContextData>(
    defaultOpportunityViewContext,
)
