import {
    useEffect,
    useState,
} from 'react'

import { SKILLS_SEARCH_DEBOUNCE_MS } from '../constants/challenge-editor.constants'
import { Skill } from '../models'
import { searchSkills } from '../services'

export interface UseSearchSkillsResult {
    isLoading: boolean
    skills: Skill[]
    error: Error | undefined
}

export function useSearchSkills(searchTerm: string): UseSearchSkillsResult {
    const [error, setError] = useState<Error | undefined>()
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [skills, setSkills] = useState<Skill[]>([])

    useEffect(() => {
        const normalizedSearchTerm = searchTerm.trim()

        if (!normalizedSearchTerm) {
            setError(undefined)
            setIsLoading(false)
            setSkills([])
            return undefined
        }

        let isMounted = true

        const timer = window.setTimeout(async () => {
            setIsLoading(true)

            try {
                const fetchedSkills = await searchSkills(normalizedSearchTerm)

                if (!isMounted) {
                    return
                }

                setError(undefined)
                setSkills(fetchedSkills)
            } catch (fetchError) {
                if (!isMounted) {
                    return
                }

                const normalizedError = fetchError instanceof Error
                    ? fetchError
                    : new Error('Failed to search skills')

                setError(normalizedError)
                setSkills([])
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }, SKILLS_SEARCH_DEBOUNCE_MS)

        return () => {
            isMounted = false
            window.clearTimeout(timer)
        }
    }, [searchTerm])

    return {
        error,
        isLoading,
        skills,
    }
}
