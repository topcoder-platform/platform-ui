import { createContext, FC, ReactNode, useContext, useMemo } from 'react'

import { UserSkill } from '~/libs/core'

import { getUserProfileStatsRoute } from '../profiles.routes'

export interface MemberProfileContextValue {
    isTalentSearch?: boolean
    skillsRenderer?: (
        skills: Pick<UserSkill, 'name'|'id'|'levels'>[]
    ) => ReactNode
    statsRoute: typeof getUserProfileStatsRoute
}

const MemberProfileRC = createContext<MemberProfileContextValue>({
    statsRoute: getUserProfileStatsRoute,
})

interface MemberProfileContextProps extends Partial<MemberProfileContextValue> {
    children?: ReactNode
}

export const MemberProfileContext: FC<MemberProfileContextProps> = props => {
    const contextValue = useMemo(() => ({
        isTalentSearch: props.isTalentSearch,
        skillsRenderer: props.skillsRenderer,
        statsRoute: props.statsRoute ?? getUserProfileStatsRoute,
    }), [props.statsRoute, props.isTalentSearch, props.skillsRenderer])

    return (
        <MemberProfileRC.Provider
            value={contextValue}
        >
            {props.children}
        </MemberProfileRC.Provider>
    )
}

export const useMemberProfileContext = (): MemberProfileContextValue => (
    useContext(MemberProfileRC)
)
