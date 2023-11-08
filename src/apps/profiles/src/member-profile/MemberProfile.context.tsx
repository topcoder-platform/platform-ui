import { createContext, FC, ReactNode, useContext, useMemo } from 'react'

import { UserSkill } from '~/libs/core'

export interface MemberProfileContextValue {
    isTalentSearch?: boolean
    skillsRenderer?: (
        skills: Pick<UserSkill, 'name'|'id'|'levels'>[]
    ) => ReactNode
}

const MemberProfileRC = createContext<MemberProfileContextValue>({})

interface MemberProfileContextProps extends MemberProfileContextValue {
    children?: ReactNode
}

export const MemberProfileContext: FC<MemberProfileContextProps> = props => {
    const contextValue = useMemo(() => ({
        isTalentSearch: props.isTalentSearch,
        skillsRenderer: props.skillsRenderer,
    }), [props.isTalentSearch, props.skillsRenderer])

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
