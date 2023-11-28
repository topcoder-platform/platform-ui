import { useEffect, useState } from 'react'
import { isEmpty } from 'lodash'

import { GenericDataObject } from '~/libs/shared'

import { StandardizedSkill, StandardizedSkillCategory } from '../services'

type SelectedSkillsKeyMap = GenericDataObject<StandardizedSkill | undefined>

export interface SkillsBulkEditorValue {
    isBulkEditing: StandardizedSkillCategory | undefined
    isSkillSelected: (skill: StandardizedSkill) => boolean
    selectAll: () => void
    toggleAll: () => void
    toggleEditMode: (category: StandardizedSkillCategory) => void
    toggleEditSkill: (skill: StandardizedSkill) => void
}

export const useSkillsBulkEditor = (skills: StandardizedSkill[]): SkillsBulkEditorValue => {
    const [isBulkEditing, setIsBulkEditing] = useState<StandardizedSkillCategory>()
    const [selectedSkills, setSelectedSkills] = useState({} as SelectedSkillsKeyMap)

    function toggleEditMode(category?: StandardizedSkillCategory): void {
        setIsBulkEditing(d => (d?.id === category?.id ? undefined : category))
    }

    function isSkillSelected(skill: StandardizedSkill): boolean {
        return !!selectedSkills[skill.id]
    }

    function toggleEditSkill(skill: StandardizedSkill): void {
        setSelectedSkills(prevSkills => ({
            ...prevSkills,
            [skill.id]: prevSkills[skill.id] ? undefined : skill,
        }))
    }

    function selectAll(): void {
        const skillsById = skills.reduce((all, skill) => {
            all[skill.id] = skill
            return all
        }, {} as SelectedSkillsKeyMap)
        setSelectedSkills(skillsById)
    }

    function toggleAll(): void {
        if (isEmpty(selectedSkills)) {
            selectAll()
            return
        }

        setSelectedSkills({} as SelectedSkillsKeyMap)
    }

    useEffect(() => {
        setSelectedSkills({} as SelectedSkillsKeyMap)
    }, [isBulkEditing])

    return {
        isBulkEditing,
        isSkillSelected,
        selectAll,
        toggleAll,
        toggleEditMode,
        toggleEditSkill,
    }
}
