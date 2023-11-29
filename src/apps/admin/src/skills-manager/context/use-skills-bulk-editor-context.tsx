import { useCallback, useEffect, useState } from 'react'
import { isEmpty } from 'lodash'

import { GenericDataObject } from '~/libs/shared'

import { StandardizedSkill, StandardizedSkillCategory } from '../services'

type SelectedSkillsKeyMap = GenericDataObject<StandardizedSkill | undefined>

export interface SkillsBulkEditorContext {
    isEditing: StandardizedSkillCategory | undefined
    isSkillSelected: (skill: StandardizedSkill) => boolean
    selectedSkills: StandardizedSkill[]
    selectAll: () => void
    toggleAll: () => void
    toggle: (category?: StandardizedSkillCategory) => void
    toggleSkill: (skill: StandardizedSkill) => void
}

export const useSkillsBulkEditorContext = (skills: StandardizedSkill[]): SkillsBulkEditorContext => {
    const [isEditing, setIsEditing] = useState<StandardizedSkillCategory>()
    const [selectedSkills, setSelectedSkills] = useState([] as StandardizedSkill[])
    const [selectedSkillsMap, setSelectedSkillsMap] = useState({} as SelectedSkillsKeyMap)

    function toggle(category?: StandardizedSkillCategory): void {
        setIsEditing(d => (d?.id === category?.id ? undefined : category))
    }

    const isSkillSelected = useCallback((skill: StandardizedSkill): boolean => (
        !!selectedSkillsMap[skill.id]
    ), [selectedSkillsMap])

    const selectSkills = useCallback((skillsMap: SelectedSkillsKeyMap): void => {
        setSelectedSkillsMap(skillsMap)
        // eslint-disable-next-line newline-per-chained-call
        const selected = Object.values(skillsMap).filter(Boolean) as StandardizedSkill[]
        setSelectedSkills(selected)
    }, [])

    const toggleSkill = useCallback((skill: StandardizedSkill): void => {
        selectSkills({
            ...selectedSkillsMap,
            [skill.id]: selectedSkillsMap[skill.id] ? undefined : skill,
        })
    }, [selectSkills, selectedSkillsMap])

    const selectAll = useCallback((): void => {
        const skillsById = skills.reduce((all, skill) => {
            all[skill.id] = skill
            return all
        }, {} as SelectedSkillsKeyMap)
        selectSkills(skillsById)
    }, [selectSkills, skills])

    const toggleAll = useCallback((): void => {
        if (isEmpty(selectedSkillsMap)) {
            selectAll()
            return
        }

        selectSkills({} as SelectedSkillsKeyMap)
    }, [selectAll, selectSkills, selectedSkillsMap])

    useEffect(() => {
        selectSkills({} as SelectedSkillsKeyMap)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing])

    return {
        isEditing,
        isSkillSelected,
        selectAll,
        selectedSkills,
        toggle,
        toggleAll,
        toggleSkill,
    }
}
