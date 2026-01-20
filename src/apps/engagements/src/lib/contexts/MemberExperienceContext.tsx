import { createContext, FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import type {
    CreateMemberExperienceRequest,
    MemberExperience,
    UpdateMemberExperienceRequest,
} from '../models'
import {
    createMemberExperience,
    getMemberExperiences,
    updateMemberExperience,
} from '../services'

interface MemberExperienceContextValue {
    engagementId: string
    assignmentId: string
    experiences: MemberExperience[]
    loading: boolean
    error?: string
    fetchExperiences: () => Promise<void>
    createExperience: (data: CreateMemberExperienceRequest) => Promise<void>
    updateExperience: (experienceId: string, data: UpdateMemberExperienceRequest) => Promise<void>
}

export const MemberExperienceContext = createContext<MemberExperienceContextValue | undefined>(undefined)

interface MemberExperienceProviderProps {
    engagementId: string
    assignmentId: string
    children: ReactNode
}

export const MemberExperienceProvider: FC<MemberExperienceProviderProps> = (
    props: MemberExperienceProviderProps,
) => {
    const engagementId = props.engagementId
    const assignmentId = props.assignmentId
    const children = props.children

    const [experiences, setExperiences] = useState<MemberExperience[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | undefined>(undefined)

    const fetchExperiences = useCallback(async (): Promise<void> => {
        if (!engagementId || !assignmentId) {
            setExperiences([])
            setError(undefined)
            setLoading(false)
            return
        }

        setLoading(true)
        setError(undefined)

        try {
            const response = await getMemberExperiences(engagementId, assignmentId)
            setExperiences(response)
        } catch (err) {
            setError('Unable to load member experiences. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [engagementId, assignmentId])

    const createExperience = useCallback(async (
        data: CreateMemberExperienceRequest,
    ): Promise<void> => {
        if (!engagementId || !assignmentId) {
            throw new Error('Engagement assignment is required to create an experience.')
        }

        setLoading(true)
        setError(undefined)

        try {
            const response = await createMemberExperience(engagementId, assignmentId, data)
            setExperiences(previous => [response, ...previous])
        } catch (err) {
            setError('Unable to save member experience. Please try again.')
            throw err
        } finally {
            setLoading(false)
        }
    }, [assignmentId, engagementId])

    const updateExperience = useCallback(async (
        experienceId: string,
        data: UpdateMemberExperienceRequest,
    ): Promise<void> => {
        if (!engagementId || !assignmentId) {
            throw new Error('Engagement assignment is required to update an experience.')
        }

        setLoading(true)
        setError(undefined)

        try {
            const response = await updateMemberExperience(
                engagementId,
                assignmentId,
                experienceId,
                data,
            )

            setExperiences(previous => previous.map(item => (
                item.id === response.id ? response : item
            )))
        } catch (err) {
            setError('Unable to update member experience. Please try again.')
            throw err
        } finally {
            setLoading(false)
        }
    }, [assignmentId, engagementId])

    useEffect(() => {
        fetchExperiences()
    }, [fetchExperiences])

    const value = useMemo(() => ({
        assignmentId,
        createExperience,
        engagementId,
        error,
        experiences,
        fetchExperiences,
        loading,
        updateExperience,
    }), [
        assignmentId,
        createExperience,
        engagementId,
        error,
        experiences,
        fetchExperiences,
        loading,
        updateExperience,
    ])

    return (
        <MemberExperienceContext.Provider value={value}>
            {children}
        </MemberExperienceContext.Provider>
    )
}

export default MemberExperienceContext
