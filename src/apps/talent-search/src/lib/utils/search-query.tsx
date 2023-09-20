import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Skill } from '~/libs/shared'

export const encodeUrlQuerySearch = (skills: Skill[]): string => (
    skills
        .map(s => `q=${encodeURIComponent(`${s.name}::${s.id}`)}`)
        .join('&')
)

export const parseUrlQuerySearch = (params: string[]): Skill[] => (
    params.map(p => {
        const [name, id] = p.split('::')
        return { id, name }
    })
)

export const useUrlQuerySearchParms = (paramName: string): [
    Skill[],
    (s: Skill[]) => void
] => {
    const [params, updateParams] = useSearchParams()

    const [skills, setSkills] = useState<Skill[]>([])

    const handleUpdateSearch = useCallback((newSkills: Skill[]) => {
        const searchParams = encodeUrlQuerySearch(newSkills)
        updateParams(`${searchParams}`)
    }, [updateParams])

    // update search input whenever the url data changes
    useEffect(() => {
        setSkills(parseUrlQuerySearch(params.getAll(paramName)))
    }, [params, paramName])

    return [skills, handleUpdateSearch]
}
