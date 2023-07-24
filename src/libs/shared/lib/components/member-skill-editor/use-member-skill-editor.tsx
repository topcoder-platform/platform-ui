import { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { differenceWith } from 'lodash'

import { profileContext, ProfileContextData } from '~/libs/core'

import {
    createMemberEmsiSkills,
    EmsiSkill,
    EmsiSkillSources,
    fetchMemberSkills,
    isSkillVerified,
    updateMemberEmsiSkills,
} from '../../services/emsi-skills'
import { InputSkillSelector } from '../input-skill-selector'

export interface MemberSkillEditor {
    formInput: ReactNode
    saveSkills: () => Promise<void>,
}

/**
 * Hook to provide functionality for using the member skill editor
 * Usage example:
 * ```
 *   const { formInput: emsiFormInput, saveSkills: saveEmsiSkills }: MemberSkillEditor = useMemberSkillEditor()
 *   ...
 *   <>
 *     {emsiFormInput}
 *     <Button primary onClick={saveEmsiSkills}>Save Skills</Button>
 *   </>
 * ```
 * @returns
 */

export const useMemberSkillEditor = ({
    limit,
}: {limit?: number} = {}): MemberSkillEditor => {
    const { profile }: ProfileContextData = useContext(profileContext)
    const [isEmsiInitialized, setIsEmsiInitialized] = useState<boolean>(false)
    const [skills, setSkills] = useState<EmsiSkill[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [, setError] = useState<string>()

    // Function that saves the updated emsi skills, will be called from outside
    const saveSkills = useCallback(async () => {
        if (!profile?.userId) {
            return
        }

        const emsiSkills = skills.map(s => ({ emsiId: s.skillId, name: s.name, sources: s.skillSources }))
        if (!isEmsiInitialized) {
            await createMemberEmsiSkills(profile.userId, emsiSkills)
            setIsEmsiInitialized(true)
            return
        }

        await updateMemberEmsiSkills(profile.userId, emsiSkills)
    }, [isEmsiInitialized, profile?.userId, skills])

    // Handle user changes

    const handleRemoveSkill = useCallback((skillId: string): void => {
        const skill = skills.find(s => s.skillId === skillId)
        if (!skill) {
            return
        }

        if (isSkillVerified(skill)) {
            return
        }

        setSkills(skills.filter(s => s.skillId !== skillId))
    }, [skills])

    const handleAddSkill = useCallback((skillData: any): void => {
        if (skills.find(s => s.skillId === skillData.value)) {
            return
        }

        setSkills([...skills, {
            name: skillData.label,
            skillId: skillData.value,
            skillSources: [EmsiSkillSources.selfPicked],
        }])
    }, [skills])

    const handleOnChange = useCallback(({ target: { value } }: any): void => {
        const removed = differenceWith(skills, value, (s, v: any) => s.skillId === v.value)
        if (removed.length) {
            removed.map(s => handleRemoveSkill(s.skillId))
        }

        const added = differenceWith(value, skills, (v: any, s: any) => v.value === s.skillId)
        if (added.length) {
            added.forEach(handleAddSkill)
        }
    }, [handleAddSkill, handleRemoveSkill, skills])

    // Load member's emsi skills, set loading state & isEmsiInitialized
    useEffect(() => {
        if (!profile?.userId) {
            return undefined
        }

        let mounted = true
        fetchMemberSkills(profile.userId)
            .catch(e => {
                setError(e?.message ?? e)
                return []
            })
            .then(emsiSkills => {
                if (!mounted) {
                    return
                }

                setIsEmsiInitialized(emsiSkills?.length > 0)
                setSkills(emsiSkills)
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
