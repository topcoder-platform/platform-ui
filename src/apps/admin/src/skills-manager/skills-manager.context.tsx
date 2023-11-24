import { createContext, FC, ReactNode, useContext, useMemo, useState } from 'react'
import { noop } from 'lodash'

import { StandardizedSkill, useFetchSkills } from './services'
import { CategoryGroup, findSkillsMatches, groupSkillsByCategories } from './lib'

export interface SkillsManagerContextValue {
    skillsFilter: string
    setSkillsFilter: (filter: string) => void
    skillsList: StandardizedSkill[]
    groupedSkills: CategoryGroup[]
}

const SkillsManagerRC = createContext<SkillsManagerContextValue>({
    groupedSkills: [],
    setSkillsFilter: noop,
    skillsFilter: '',
    skillsList: [],
})

interface SkillsManagerContextProps {
    children?: ReactNode
}

export const SkillsManagerContext: FC<SkillsManagerContextProps> = props => {
    const [skillsFilter, setSkillsFilter] = useState('')

    const allSkills = useFetchSkills()

    const skills = useMemo(() => findSkillsMatches(allSkills ?? [], skillsFilter), [allSkills, skillsFilter])

    const groupedSkills = useMemo(() => groupSkillsByCategories(skills), [skills])

    const contextValue = useMemo(() => ({
        groupedSkills,
        setSkillsFilter,
        skillsFilter,
        skillsList: skills,
    }), [groupedSkills, skills, skillsFilter])

    return (
        <SkillsManagerRC.Provider
            value={contextValue}
        >
            {props.children}
        </SkillsManagerRC.Provider>
    )
}

export const useSkillsManagerContext = (): SkillsManagerContextValue => (
    useContext(SkillsManagerRC)
)
