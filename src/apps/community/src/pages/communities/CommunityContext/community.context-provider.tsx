import { FC, PropsWithChildren } from 'react'

import {
    communityContext,
    CommunityContextValue,
} from './community.context'

export interface CommunityContextProviderProps {
    value: CommunityContextValue
}

/**
 * Provides active community metadata and membership state to nested pages.
 *
 * @param props Provider value and child content.
 * @returns Context provider wrapper.
 */
export const CommunityContextProvider: FC<PropsWithChildren<CommunityContextProviderProps>>
    = (props: PropsWithChildren<CommunityContextProviderProps>) => (
        <communityContext.Provider value={props.value}>
            {props.children}
        </communityContext.Provider>
    )
