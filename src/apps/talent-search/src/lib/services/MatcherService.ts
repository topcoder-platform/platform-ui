/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable space-before-blocks */
/* eslint-disable @typescript-eslint/typedef */
import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import Skill from '@talentSearch/lib/models/Skill'
import Member from '@talentSearch/lib/models/Member'

export async function autoCompleteSkills(search:string): Promise<Array<Skill>>{
    return xhrGetAsync(`${EnvironmentConfig.API.V5}/emsi-skills/skills/auto-complete?term=${search}`)
}

export async function retrieveMatchesForSkills(
    skills:ReadonlyArray<Skill>,
    page:number,
    pageSize:number,
): Promise<Array<Member>>{
    const params = new URLSearchParams()
    skills.forEach(value => params.append('skillId', value.emsiId))
    params.append('sortBy', 'skillScore')
    params.append('sortOrder', 'desc')
    params.append('page', `${page}`)
    params.append('perPage', `${pageSize}`)

    const url = `${EnvironmentConfig.API.V5}/members/searchBySkills?${params.toString()}`

    return xhrGetAsync(url)
}

const MatcherService = {
    autoCompleteSkills,
    retrieveMatchesForSkills,
}

export default MatcherService
