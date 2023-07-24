import { createContext, FC, ReactNode, useContext, useMemo } from 'react'

import { UserEMSISkill } from '~/libs/core'

export interface MemberProfileContextValue {
    skillsRenderer?: (
        skills: Pick<UserEMSISkill, 'name'|'skillId'|'skillSources'>[]
    ) => ReactNode
}

const MemberProfileRC = createContext<MemberProfileContextValue>({})

interface MemberProfileContextProps {
    skillsRenderer?: MemberProfileContextValue['skillsRenderer']
    children?: ReactNode
}

export const MemberProfileContext: FC<MemberProfileContextProps> = props => {
    const contextValue = useMemo(() => ({
        skillsRenderer: props.skillsRenderer,
    }), [props.skillsRenderer])

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
