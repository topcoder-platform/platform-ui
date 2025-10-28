import { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { differenceWith, filter } from 'lodash'

import {
    profileContext,
    ProfileContextData,
    UserSkill,
    UserSkillDisplayModes,
    useUserSkillsDisplayModes,
} from '~/libs/core'
import { MAX_PRINCIPAL_SKILLS_COUNT } from '~/apps/profiles/src/config'

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
    const displayModes = useUserSkillsDisplayModes()

    const principalSkills = useMemo(() => (
        filter(skills, s => s.displayMode?.name === UserSkillDisplayModes.principal)
    ), [skills])

    const additionalSkills = useMemo(() => (
        filter(skills, s => s.displayMode?.name === UserSkillDisplayModes.additional)
    ), [skills])

    // Function that saves the updated skills, will be called from outside
    const saveSkills = useCallback(async () => {
        if (!profile?.userId) {
            return
        }

        // Ensure we always have a valid displayModeId when saving
        const skillsData = skills.map(skill => {
            // If displayMode id is missing (e.g., user added before modes loaded),
            // try to resolve it from the loaded display modes record by name
            const resolvedDisplayMode = (displayModes as any)?.[skill.displayMode?.name]
            const displayModeId = skill.displayMode?.id || resolvedDisplayMode?.id

            return {
                displayModeId,
                id: skill.id,
            }
        })

        if (!isInitialized) {
            await createMemberSkills(profile.userId, skillsData)
            setIsInitialized(true)
            return
        }

        await updateMemberSkills(profile.userId, skillsData)
    }, [isInitialized, profile?.userId, skills, displayModes])

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

    const handleAddSkill = useCallback((type: UserSkillDisplayModes, skillData: any): void => {
        const skill = skills.find(s => s.id === skillData.value)

        // Fallback displayMode with name if ids not yet loaded
        const modeRecord = (displayModes as any)?.[type] || { id: '', name: type }

        setSkills([...skills.filter(s => s.id !== skillData.value), {
            category: skillData.category,
            id: skillData.value,
            levels: [],
            name: skillData.label,
            ...skill,
            displayMode: modeRecord,
        }])
    }, [skills, displayModes])

    const handleOnChange = useCallback((type: UserSkillDisplayModes) => ({ target: { value } }: any): void => {
        const currentSkillSet = type === UserSkillDisplayModes.principal ? principalSkills : additionalSkills
        const removed = differenceWith(currentSkillSet, value, (s, v: any) => s.id === v.value)
        if (removed.length) {
            removed.map(s => handleRemoveSkill(s.id))
        }

        const added = differenceWith(value, currentSkillSet, (v: any, s: any) => v.value === s.id)
        if (added.length) {
            added.forEach(handleAddSkill.bind(this, type))
        }
    }, [additionalSkills, handleAddSkill, handleRemoveSkill, principalSkills])

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
        <>
            <p className='body-main-bold'>Principal Skills</p>
            <p>
                Add up to 10 of the skills that are central to your expertise.
                These will be showcased at the top of your profile.
            </p>
            <InputSkillSelector
                label='Select Principal Skills'
                value={principalSkills}
                onChange={handleOnChange(UserSkillDisplayModes.principal)}
                loading={loading}
                limit={MAX_PRINCIPAL_SKILLS_COUNT}
            />

            <p className='body-main-bold'>Additional skills</p>
            <p>
                All your other skills that make you a valuable asset on a project or a team.
            </p>
            <InputSkillSelector
                label='Select Additional Skills'
                value={additionalSkills}
                onChange={handleOnChange(UserSkillDisplayModes.additional)}
                loading={loading}
                limit={limit ? limit - MAX_PRINCIPAL_SKILLS_COUNT : 0}
            />
        </>
    ), [principalSkills, handleOnChange, loading, additionalSkills, limit])

    return {
        formInput,
        saveSkills,
    }
}
