import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { UserSkill } from '~/libs/core'

type PartialUserSkill = Pick<UserSkill, 'id'|'name'>

export const encodeUrlQuerySearch = (skills: PartialUserSkill[]): string => (
    skills
        .map(s => `q=${encodeURIComponent(`${s.name}::${s.id}`)}`)
        .join('&')
)

export const parseUrlQuerySearch = (params: string[]): UserSkill[] => (
    params.map(p => {
        const [name, id] = p.split('::')
        return { category: { id: '', name: '' }, id, levels: [], name }
    })
)

export const useUrlQuerySearchParms = (paramName: string): [
    UserSkill[],
    (s: PartialUserSkill[]) => void
] => {
    const [params, updateParams] = useSearchParams()

    const [skills, setSkills] = useState<UserSkill[]>([])

    const handleUpdateSearch = useCallback((newSkills: PartialUserSkill[]) => {
        const searchParams = encodeUrlQuerySearch(newSkills)
        updateParams(`${searchParams}`)
    }, [updateParams])

    // update search input whenever the url data changes
    useEffect(() => {
        setSkills(parseUrlQuerySearch(params.getAll(paramName)))
    }, [params, paramName])

    return [skills, handleUpdateSearch]
}
