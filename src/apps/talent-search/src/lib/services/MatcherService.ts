import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import Skill from '@talentSearch/lib/models/Skill'
import Member from '@talentSearch/lib/models/Member'

export async function getAllSkills(): Promise<Array<Skill>>{
    return xhrGetAsync(`${EnvironmentConfig.API.V1}/match-engine/skills`)
}

export async function retrieveMatchesForSkills(skills:ReadonlyArray<Skill>): Promise<Array<Member>>{
  const params = new URLSearchParams()
  console.log("Search skills: " + JSON.stringify(skills))
  skills.forEach(value => params.append('skill', value.skillName))
  params.append('sortBy', 'numberOfChallengesWon')
  params.append('sortOrder', 'desc')
  
  const url = `${EnvironmentConfig.API.V1}/match-engine/members?${params.toString()}`

  return xhrGetAsync(url)
}

const MatcherService = {
  getAllSkills,
  retrieveMatchesForSkills,
};

export default MatcherService;