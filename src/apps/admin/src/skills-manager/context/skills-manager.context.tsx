import { createContext, FC, ReactNode, useContext, useMemo, useState } from 'react'
import { orderBy } from 'lodash'
import { SWRResponse } from 'swr'

import { StandardizedSkill, StandardizedSkillCategory, useFetchCategories, useFetchSkills } from '../services'
import { findSkillsMatches, GroupedSkills, groupSkillsByCategory } from '../lib'

import { SkillsBulkEditorValue, useSkillsBulkEditor } from './use-skills-bulk-editor'

export interface SkillsManagerContextValue extends SkillsBulkEditorValue {
    categories: StandardizedSkillCategory[]
    skillsFilter: string
    setSkillsFilter: (filter: string) => void
    skillsList: StandardizedSkill[]
    groupedSkills: GroupedSkills
    editCategory: StandardizedSkillCategory | undefined
    setEditCategory: (group?: StandardizedSkillCategory) => void
    editSkill: StandardizedSkill | undefined
    setEditSkill: (skill?: StandardizedSkill) => void
    refetchCategories: () => void
    refetchSkills: () => void
}

const SkillsManagerRC = createContext<SkillsManagerContextValue>({
} as SkillsManagerContextValue)

interface SkillsManagerContextProps {
    children?: ReactNode
}

export const SkillsManagerContext: FC<SkillsManagerContextProps> = props => {
    const [skillsFilter, setSkillsFilter] = useState('')
    const [editCategory, setEditCategory] = useState<StandardizedSkillCategory>()
    const [editSkill, setEditSkill] = useState<StandardizedSkill>()

    const {
        data: allSkills,
        mutate: refetchSkills,
    }: SWRResponse<StandardizedSkill[]> = useFetchSkills()

    const {
        data: allCategories,
        mutate: refetchCategories,
    }: SWRResponse<StandardizedSkillCategory[]> = useFetchCategories()

    const skills = useMemo(() => findSkillsMatches(allSkills ?? [], skillsFilter), [allSkills, skillsFilter])
    const groupedSkills = useMemo(() => groupSkillsByCategory(skills), [skills])

    const skillsBulkEditor = useSkillsBulkEditor(skills)

    const contextValue = useMemo(() => ({
        ...skillsBulkEditor,
        categories: orderBy(allCategories ?? [], 'name', 'asc'),
        editCategory,
        editSkill,
        groupedSkills,
        refetchCategories,
        refetchSkills,
        setEditCategory,
        setEditSkill,
        setSkillsFilter,
        skillsFilter,
        skillsList: skills,
    }), [
        skillsBulkEditor,
        allCategories,
        editCategory,
        editSkill,
        groupedSkills,
        refetchCategories,
        refetchSkills,
        skills,
        skillsFilter,
    ])

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
