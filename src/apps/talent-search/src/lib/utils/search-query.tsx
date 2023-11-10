import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { SearchUserSkill, UserSkill } from '~/libs/core'

export const encodeUrlQuerySearch = (skills: SearchUserSkill[]): string => (
    skills
        .map(s => `q=${encodeURIComponent(`${s.name}::${s.id}`)}`)
        .join('&')
)

export const parseUrlQuerySearch = (params: string[]): SearchUserSkill[] => (
    params.map(p => {
        const [name, id] = p.split('::')
        return { id, name }
    })
)

export const useUrlQuerySearchParms = (paramName: string): [
    UserSkill[],
    (s: SearchUserSkill[]) => void
] => {
    const [params, updateParams] = useSearchParams()

    const [skills, setSkills] = useState<UserSkill[]>([])

    const handleUpdateSearch = useCallback((newSkills: SearchUserSkill[]) => {
        const searchParams = encodeUrlQuerySearch(newSkills)
        updateParams(`${searchParams}`)
    }, [updateParams])

    // update search input whenever the url data changes
    useEffect(() => {
        setSkills(parseUrlQuerySearch(params.getAll(paramName)) as UserSkill[])
    }, [params, paramName])

    return [skills, handleUpdateSearch]
}
