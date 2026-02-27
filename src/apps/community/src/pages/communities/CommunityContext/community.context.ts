import { createContext, useContext } from 'react'

import { CommunityMeta } from '../../../lib'

export interface CommunityContextValue {
    isMember: boolean
    meta: CommunityMeta
}

export const communityContext = createContext<CommunityContextValue | undefined>(undefined)

/**
 * Accesses active community metadata from context.
 *
 * @returns Community context value when available.
 */
export function useCommunityContext(): CommunityContextValue | undefined {
    return useContext(communityContext)
}
