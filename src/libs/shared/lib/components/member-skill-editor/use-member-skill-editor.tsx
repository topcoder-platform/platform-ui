import { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { differenceWith } from 'lodash'

import { profileContext, ProfileContextData, UserSkill } from '~/libs/core'

import {
    createMemberSkills,
    fetchMemberSkills,
    isSkillVerified,
    updateMemberSkills,
} from '../../services/standard-skills'
import { InputSkillSelector } from '../input-skill-selector'

export interface MemberSkillEditor {
    formInput: ReactNode
    saveSkills: () => Promise<void>,
}

/**
 * Hook to provide functionality for using the member skill editor
 * Usage example:
 * ```
 *   const editor: MemberSkillEditor = useMemberSkillEditor()
 *   ...
 *   <>
 *     {editor.formInput}
 *     <Button primary onClick={editor.saveSkills}>Save Skills</Button>
 *   </>
 * ```
 * @returns
 */

export const useMemberSkillEditor = ({
    limit,
}: {limit?: number} = {}): MemberSkillEditor => {
    const { profile }: ProfileContextData = useContext(profileContext)
    const [isInitialized, setIsInitialized] = useState<boolean>(false)
    const [skills, setSkills] = useState<UserSkill[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [, setError] = useState<string>()

    // Function that saves the updated skills, will be called from outside
    const saveSkills = useCallback(async () => {
        if (!profile?.userId) {
            return
        }

        if (!isInitialized) {
            await createMemberSkills(profile.userId, skills)
            setIsInitialized(true)
            return
        }

        await updateMemberSkills(profile.userId, skills)
    }, [isInitialized, profile?.userId, skills])

    // Handle user changes

    const handleRemoveSkill = useCallback((skillId: string): void => {
        const skill = skills.find(s => s.id === skillId)
        if (!skill) {
            return
        }

        if (isSkillVerified(skill)) {
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
            id: skillData.value,
            levels: [],
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

    // Load member's skills, set loading state & isInitialized
    useEffect(() => {
        if (!profile?.userId) {
            return undefined
        }

        let mounted = true
        fetchMemberSkills(profile.userId, { skipPagination: true })
            .catch(e => {
                setError(e?.message ?? e)
                return []
            })
            .then(savedSkills => {
                if (!mounted) {
                    return
                }

                setIsInitialized(savedSkills?.length > 0)
                setSkills(savedSkills)
                setLoading(false)
            })

        return () => { mounted = false }
    }, [profile?.userId])

    // build the form input
    const formInput = useMemo(() => (
        <InputSkillSelector
            value={skills}
            onChange={handleOnChange}
            loading={loading}
            limit={limit}
        />
    ), [skills, handleOnChange, loading, limit])

    return {
        formInput,
        saveSkills,
    }
}
