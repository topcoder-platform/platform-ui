/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'
import SkillInfo from '../models/SkillInfo'

export async function autoCompleteSkills(search: string): Promise<Array<SkillInfo>> {
    return xhrGetAsync(`${EnvironmentConfig.API.V5}/emsi-skills/skills/auto-complete?term=${search}`)
}
