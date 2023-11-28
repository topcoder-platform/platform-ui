import { SWRResponse } from 'swr'

import { StandardizedSkill, useFetchSkills } from '../services'

interface SkillsContextValue {

}

export const useSkillsContext = (): void => {
    const {
        data: allSkills,
        mutate: refetchSkills,
    }: SWRResponse<StandardizedSkill[]> = useFetchSkills()
}
