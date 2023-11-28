import { useEffect, useState } from 'react'
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

    function isSkillSelected(skill: StandardizedSkill): boolean {
        return !!selectedSkillsMap[skill.id]
    }

    function selectSkills(skillsMap: SelectedSkillsKeyMap): void {
        // eslint-disable-next-line newline-per-chained-call
        const selected = Object.values(skillsMap).filter(Boolean) as StandardizedSkill[]
        setSelectedSkills(selected)
        setSelectedSkillsMap(skillsMap)
    }

    function toggleSkill(skill: StandardizedSkill): void {
        selectSkills({
            ...selectedSkillsMap,
            [skill.id]: selectedSkillsMap[skill.id] ? undefined : skill,
        })
    }

    function selectAll(): void {
        const skillsById = skills.reduce((all, skill) => {
            all[skill.id] = skill
            return all
        }, {} as SelectedSkillsKeyMap)
        selectSkills(skillsById)
    }

    function toggleAll(): void {
        if (isEmpty(selectedSkillsMap)) {
            selectAll()
            return
        }

        selectSkills({} as SelectedSkillsKeyMap)
    }

    useEffect(() => {
        selectSkills({} as SelectedSkillsKeyMap)
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
