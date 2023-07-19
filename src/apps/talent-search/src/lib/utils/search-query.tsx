import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Skill } from '~/libs/shared'

export const encodeUrlQuerySearch = (skills: Skill[]): string => (
    skills
        .map(s => `q=${encodeURIComponent(`${s.name}::${s.emsiId}`)}`)
        .join('&')
)

export const parseUrlQuerySearch = (params: string[]): Skill[] => (
    params.map(p => {
        const [name, emsiId] = p.split('::')
        return { emsiId, name }
    })
)

export const useUrlQuerySearchParms = (paramName: string): [
    Skill[],
    (s: Skill[]) => void
] => {
    const [params, updateParams] = useSearchParams()

    const [skills, setSkills] = useState<Skill[]>([])

    function handleUpdateSearch(newSkills: Skill[]): void {
        const searchParams = encodeUrlQuerySearch(newSkills)
        updateParams(`${searchParams}`)
    }

    // update search input whenever the url data changes
    useEffect(() => {
        setSkills(parseUrlQuerySearch(params.getAll(paramName)))
    }, [params, paramName])

    return [skills, handleUpdateSearch]
}
