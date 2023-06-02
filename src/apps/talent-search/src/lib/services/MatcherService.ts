import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'
import { Member, Skill } from '@talentSearch/lib/models'

export default class MatcherService {
    public static async autoCompleteSkills(search:string): Promise<Array<Skill>> {
        return xhrGetAsync(`${EnvironmentConfig.API.V5}/emsi-skills/skills/auto-complete?term=${search}`)
    }

    public static async retrieveMatchesForSkills(
        skills:ReadonlyArray<Skill>,
        page:number,
        pageSize:number,
    ): Promise<Array<Member>> {
        const params: URLSearchParams = new URLSearchParams()
        skills.forEach(value => params.append('skillId', value.emsiId))
        params.append('sortBy', 'numberOfChallengesWon')
        params.append('sortOrder', 'desc')
        params.append('page', `${page}`)
        params.append('perPage', `${pageSize}`)

        const url: string = `${EnvironmentConfig.API.V5}/members/searchBySkills?${params.toString()}`

        return xhrGetAsync(url)
    }
}
