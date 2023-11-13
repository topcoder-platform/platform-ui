import { find } from 'lodash'
import { SWRResponse } from 'swr'
import useSWRImmutable from 'swr/immutable'

import { UserSkillDisplayMode, UserSkillDisplayModes, userSkillsUrl } from '~/libs/core'

export interface UserSkillDisplayModeRecords {
    additional: UserSkillDisplayMode,
    principal: UserSkillDisplayMode,
}

export function useUserSkillsDisplayModes(): UserSkillDisplayModeRecords {
    const { data: modes }: SWRResponse = useSWRImmutable(userSkillsUrl('display-modes'))

    return {
        additional: find(modes, { name: UserSkillDisplayModes.additional }),
        principal: find(modes, { name: UserSkillDisplayModes.principal }),
    }
}
