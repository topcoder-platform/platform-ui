import { ReactNode, useCallback, useMemo, useState } from 'react'
import { differenceWith } from 'lodash'

import { InputSkillSelector } from '~/libs/shared'

import {
    LearnCourse,
    TCACertification,
    TCASkillType,
    updateTCACertSkills,
    updateTCACourseSkills,
} from '../../data-providers'

interface SkillEditorProps {
    certification?: TCACertification
    course?: LearnCourse
}

export interface SkillEditor {
    formInput: ReactNode
    saveSkills: () => Promise<void>,
}

/**
 * Hook to provide functionality for using the skill editor
 * Usage example:
 * ```
 *   const editor: SkillEditor = useSkillEditor()
 *   ...
 *   <>
 *     {editor.formInput}
 *     <Button primary onClick={editor.saveSkills}>Save Skills</Button>
 *   </>
 * ```
 * @returns
 */

export const useSkillEditor = (props: SkillEditorProps): SkillEditor => {
    const [skills, setSkills] = useState<TCASkillType[]>(props.certification?.skills || props.course?.skills || [])

    // Function that saves the updated skills, will be called from outside
    const saveSkills = useCallback(async () => {
        if (props.certification) {
            await updateTCACertSkills(props.certification, skills)
        }

        if (props.course) {
            await updateTCACourseSkills(props.course, skills)
        }

    }, [props.certification, props.course, skills])

    // Handle user changes
    const handleRemoveSkill = useCallback((skillId: string): void => {
        const skill = skills.find(s => s.id === skillId)
        if (!skill) {
            return
        }

        setSkills(skills.filter(s => s.id !== skillId))
    }, [skills])

    const handleAddSkill = useCallback((skillData: any): void => {
        if (skills.find(s => s.id === skillData.value)) {
            return
        }

        setSkills([...skills, {
            category: skillData.category,
            description: skillData.description,
            id: skillData.value,
            name: skillData.label,
        }])
    }, [skills])

    const handleOnChange = useCallback(({ target: { value } }: any): void => {
        const removed = differenceWith(skills, value, (s, v: any) => s.id === v.value)
        if (removed.length) {
            removed.map(s => handleRemoveSkill(s.id))
        }

        const added = differenceWith(value, skills, (v: any, s: any) => v.value === s.skillId)
        if (added.length) {
            added.forEach(handleAddSkill)
        }
    }, [handleAddSkill, handleRemoveSkill, skills])

    // build the form input
    const formInput = useMemo(() => (
        <InputSkillSelector
            value={skills}
            onChange={handleOnChange}
        />
    ), [skills, handleOnChange])

    return {
        formInput,
        saveSkills,
    }
}
