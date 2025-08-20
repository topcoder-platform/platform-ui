import { createContext, FC, ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { SWRResponse } from 'swr'

import { StandardizedSkill, StandardizedSkillCategory, useFetchCategories, useFetchSkills } from '../services'
import { findSkillsMatches, GroupedSkills, groupSkillsByCategory } from '../lib'

import { SkillsBulkEditorContext, useSkillsBulkEditorContext } from './use-skills-bulk-editor-context'

export interface SkillsManagerContextValue {
    allSkills: StandardizedSkill[],
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
    showArchivedSkills: boolean
    toggleArchivedSkills: () => void
    bulkEditorCtx: SkillsBulkEditorContext
}

const SkillsManagerRC = createContext<SkillsManagerContextValue>({
} as SkillsManagerContextValue)

interface SkillsManagerContextProps {
    children?: ReactNode
}

export const SkillsManagerContext: FC<SkillsManagerContextProps> = props => {
    const [showArchivedSkills, setShowArchivedSkills] = useState(false)
    const [skillsFilter, setSkillsFilter] = useState('')
    const [editCategory, setEditCategory] = useState<StandardizedSkillCategory>()
    const [editSkill, setEditSkill] = useState<StandardizedSkill>()

    const {
        data: allSkills = [],
        mutate: refetchSkills,
    }: SWRResponse<StandardizedSkill[]> = useFetchSkills(true)

    const {
        data: allCategories = [],
        mutate: refetchCategories,
    }: SWRResponse<StandardizedSkillCategory[]> = useFetchCategories()

    const filteredSkills = useMemo(() => (
        showArchivedSkills ? allSkills : allSkills.filter(s => !s.deleted_at)
    ), [allSkills, showArchivedSkills])

    const skills = useMemo(() => findSkillsMatches(filteredSkills, skillsFilter), [filteredSkills, skillsFilter])
    const groupedSkills = useMemo(() => groupSkillsByCategory(skills), [skills])

    const bulkEditorCtx = useSkillsBulkEditorContext(skills)

    const toggleArchivedSkills = useCallback((): void => {
        setShowArchivedSkills(d => !d)
    }, [])

    const contextValue = useMemo(() => ({
        allSkills,
        bulkEditorCtx,
        categories: allCategories,
        editCategory,
        editSkill,
        groupedSkills,
        refetchCategories,
        refetchSkills,
        setEditCategory,
        setEditSkill,
        setSkillsFilter,
        showArchivedSkills,
        skillsFilter,
        skillsList: skills,
        toggleArchivedSkills,
    }), [
        allSkills,
        bulkEditorCtx,
        allCategories,
        editCategory,
        editSkill,
        groupedSkills,
        refetchCategories,
        refetchSkills,
        skills,
        skillsFilter,
        showArchivedSkills,
        toggleArchivedSkills,
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
