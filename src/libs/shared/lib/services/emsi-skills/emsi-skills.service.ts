import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import Skill from './skill.model'

export async function autoCompleteSkills(queryTerm: string): Promise<Skill[]> {
    return xhrGetAsync(`${EnvironmentConfig.API.V5}/emsi-skills/skills/auto-complete?term=${queryTerm}`)
}
