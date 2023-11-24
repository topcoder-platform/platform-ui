import { createContext, FC, ReactNode, useContext, useMemo, useState } from 'react'
import { noop, orderBy } from 'lodash'

import { StandardizedSkill, StandardizedSkillCategory, useFetchCategories, useFetchSkills } from './services'
import { CategoryGroup, findSkillsMatches, groupSkillsByCategories } from './lib'

export interface SkillsManagerContextValue {
    allCategories: StandardizedSkillCategory[]
    skillsFilter: string
    setSkillsFilter: (filter: string) => void
    skillsList: StandardizedSkill[]
    groupedSkills: CategoryGroup[]
    editCategory: CategoryGroup | undefined
    setEditCategory: (group?: CategoryGroup) => void
}

const SkillsManagerRC = createContext<SkillsManagerContextValue>({
    allCategories: [],
    editCategory: undefined,
    groupedSkills: [],
    setEditCategory: noop,
    setSkillsFilter: noop,
    skillsFilter: '',
    skillsList: [],
})

interface SkillsManagerContextProps {
    children?: ReactNode
}

export const SkillsManagerContext: FC<SkillsManagerContextProps> = props => {
    const [skillsFilter, setSkillsFilter] = useState('')
    const [editCategory, setEditCategory] = useState<CategoryGroup>()

    const allSkills = useFetchSkills()
    const allCategories = useFetchCategories()

    const skills = useMemo(() => findSkillsMatches(allSkills ?? [], skillsFilter), [allSkills, skillsFilter])

    const groupedSkills = useMemo(() => groupSkillsByCategories(skills), [skills])

    const contextValue = useMemo(() => ({
        allCategories: orderBy(allCategories ?? [], 'name', 'asc'),
        editCategory,
        groupedSkills,
        setEditCategory,
        setSkillsFilter,
        skillsFilter,
        skillsList: skills,
    }), [allCategories, editCategory, groupedSkills, skills, skillsFilter])

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
